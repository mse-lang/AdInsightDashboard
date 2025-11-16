/**
 * Google Analytics API 연결 테스트 스크립트
 * 
 * 사용법: npx tsx scripts/test-ga-connection.ts
 */

import jwt from 'jsonwebtoken';

const propertyId = process.env.GA_PROPERTY_ID;
const credentialsJson = process.env.GA_CREDENTIALS;

console.log('\n========================================');
console.log('Google Analytics API 연결 테스트');
console.log('========================================\n');

if (!propertyId || !credentialsJson) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.log('먼저 check-ga-credentials.ts를 실행하세요.');
  process.exit(1);
}

async function testConnection() {
  try {
    const credentials = JSON.parse(credentialsJson);
    
    console.log('1️⃣ 서비스 계정 인증 시작...');
    console.log(`   서비스 계정: ${credentials.client_email}\n`);
    
    // JWT 생성
    const now = Math.floor(Date.now() / 1000);
    const jwtClaims = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };
    
    const jwtToken = jwt.sign(
      jwtClaims,
      credentials.private_key,
      { algorithm: "RS256" }
    );
    
    console.log('2️⃣ OAuth 토큰 요청 중...');
    
    // OAuth 토큰 받기
    const authResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwtToken
      }).toString()
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ OAuth 인증 실패:', errorText);
      throw new Error("Google Auth error");
    }
    
    const authData = await authResponse.json();
    console.log('✅ OAuth 토큰 획득 성공\n');
    
    console.log('3️⃣ Google Analytics Data API 요청 중...');
    console.log(`   GA4 속성 ID: ${propertyId}\n`);
    
    // GA4 API 호출
    const analyticsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authData.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "averageSessionDuration" },
            { name: "bounceRate" }
          ]
        })
      }
    );
    
    if (!analyticsResponse.ok) {
      const errorData = await analyticsResponse.json();
      console.error('❌ Google Analytics API 오류:');
      console.error(JSON.stringify(errorData, null, 2));
      
      if (errorData.error?.code === 403) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('권한 오류 해결 방법:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. https://analytics.google.com 접속');
        console.log('2. 좌측 하단 ⚙️ (관리) 클릭');
        console.log('3. "속성 액세스 관리" 클릭');
        console.log('4. 우측 상단 "+" → "사용자 추가" 클릭');
        console.log(`5. 이메일: ${credentials.client_email}`);
        console.log('6. 역할: "뷰어" 선택');
        console.log('7. "추가" 클릭');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      throw new Error("Google Analytics API error");
    }
    
    const data = await analyticsResponse.json();
    const metrics = data.rows?.[0]?.metricValues || [];
    
    console.log('✅ Google Analytics API 연결 성공!\n');
    console.log('최근 30일 데이터:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 페이지뷰: ${parseInt(metrics[0]?.value || "0").toLocaleString()}`);
    console.log(`👥 활성 사용자: ${parseInt(metrics[1]?.value || "0").toLocaleString()}`);
    console.log(`⏱️  평균 체류시간: ${Math.floor(parseFloat(metrics[2]?.value || "0") / 60)}분 ${Math.floor(parseFloat(metrics[2]?.value || "0") % 60)}초`);
    console.log(`📉 이탈률: ${(parseFloat(metrics[3]?.value || "0") * 100).toFixed(1)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🎉 Google Analytics 연결이 정상적으로 작동합니다!');
    console.log('이제 애플리케이션의 "성과 분석" 페이지에서 실제 데이터를 확인할 수 있습니다.\n');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testConnection();
