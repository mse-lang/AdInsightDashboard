/**
 * Google Analytics 서비스 계정 정보 확인 스크립트
 * 
 * 사용법: npx tsx scripts/check-ga-credentials.ts
 */

const credentialsJson = process.env.GA_CREDENTIALS;
const propertyId = process.env.GA_PROPERTY_ID;

console.log('\n========================================');
console.log('Google Analytics 서비스 계정 정보 확인');
console.log('========================================\n');

if (!credentialsJson) {
  console.error('❌ GA_CREDENTIALS 환경 변수가 설정되지 않았습니다.');
  console.log('\n설정 방법:');
  console.log('1. Replit Secrets에서 GA_CREDENTIALS 추가');
  console.log('2. Google Cloud Console에서 서비스 계정 키 JSON 전체를 붙여넣기');
  process.exit(1);
}

if (!propertyId) {
  console.error('❌ GA_PROPERTY_ID 환경 변수가 설정되지 않았습니다.');
  console.log('\n설정 방법:');
  console.log('1. Google Analytics 관리 → 속성 설정');
  console.log('2. 속성 ID 복사 (예: 123456789)');
  console.log('3. Replit Secrets에서 GA_PROPERTY_ID 추가');
  process.exit(1);
}

try {
  const credentials = JSON.parse(credentialsJson);
  
  console.log('✅ GA_CREDENTIALS 파싱 성공\n');
  console.log('서비스 계정 정보:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 이메일: ${credentials.client_email}`);
  console.log(`🔑 프로젝트 ID: ${credentials.project_id}`);
  console.log(`🆔 클라이언트 ID: ${credentials.client_id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✅ GA_PROPERTY_ID 설정됨\n');
  console.log('GA4 속성 정보:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏷️  속성 ID: ${propertyId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('다음 단계: 서비스 계정에 GA4 접근 권한 부여');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. https://analytics.google.com 접속');
  console.log('2. 좌측 하단 ⚙️ (관리) 클릭');
  console.log('3. "속성 액세스 관리" 클릭');
  console.log('4. 우측 상단 "+" → "사용자 추가" 클릭');
  console.log(`5. 다음 이메일 입력: ${credentials.client_email}`);
  console.log('6. 역할: "뷰어" 선택');
  console.log('7. "추가" 클릭\n');
  
  console.log('권한 부여 후 테스트:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('npx tsx scripts/test-ga-connection.ts');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
} catch (error) {
  console.error('❌ GA_CREDENTIALS JSON 파싱 오류:', error);
  console.log('\n올바른 형식:');
  console.log('{');
  console.log('  "type": "service_account",');
  console.log('  "project_id": "...",');
  console.log('  "private_key_id": "...",');
  console.log('  "private_key": "...",');
  console.log('  "client_email": "...",');
  console.log('  "client_id": "...",');
  console.log('  ...');
  console.log('}');
  process.exit(1);
}
