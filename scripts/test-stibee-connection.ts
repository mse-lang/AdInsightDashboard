/**
 * Stibee API 연결 테스트 스크립트
 * 
 * 사용법: npx tsx scripts/test-stibee-connection.ts
 */

const apiKey = process.env.STIBEE_API_KEY;

console.log('\n========================================');
console.log('Stibee API 연결 테스트');
console.log('========================================\n');

if (!apiKey) {
  console.error('❌ STIBEE_API_KEY가 설정되지 않았습니다.');
  console.log('먼저 check-stibee-credentials.ts를 실행하세요.');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('1️⃣ Stibee API 인증 시작...');
    console.log(`   API 키: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}\n`);
    
    console.log('2️⃣ 주소록 목록 조회 중...');
    
    // Stibee API: 주소록 목록 조회
    const listsResponse = await fetch('https://api.stibee.com/v1/lists', {
      method: 'GET',
      headers: {
        'AccessToken': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!listsResponse.ok) {
      const errorText = await listsResponse.text();
      console.error('❌ Stibee API 오류:', errorText);
      
      if (listsResponse.status === 401 || listsResponse.status === 403) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('인증 오류 해결 방법:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. https://www.stibee.com 로그인');
        console.log('2. 설정 → API');
        console.log('3. API 키가 활성화되어 있는지 확인');
        console.log('4. 새 API 키 생성 (필요시)');
        console.log('5. Replit Secrets에서 STIBEE_API_KEY 업데이트');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
      
      throw new Error('Stibee API error');
    }
    
    const listsData = await listsResponse.json();
    console.log('✅ 주소록 조회 성공\n');
    
    if (!listsData || listsData.length === 0) {
      console.log('⚠️  주소록이 없습니다.');
      console.log('Stibee 대시보드에서 먼저 주소록을 만들어주세요.\n');
      return;
    }
    
    console.log(`📚 주소록 개수: ${listsData.length}개\n`);
    
    // 첫 번째 주소록의 통계 조회
    const firstList = listsData[0];
    console.log('3️⃣ 첫 번째 주소록 통계 조회 중...');
    console.log(`   주소록: ${firstList.name || 'Unnamed'} (ID: ${firstList.listId})\n`);
    
    const statsResponse = await fetch(`https://api.stibee.com/v1/lists/${firstList.listId}/stats`, {
      method: 'GET',
      headers: {
        'AccessToken': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!statsResponse.ok) {
      console.warn('⚠️  통계 조회 실패 (주소록은 정상)');
      const errorText = await statsResponse.text();
      console.warn('   오류:', errorText);
    } else {
      const statsData = await statsResponse.json();
      console.log('✅ 통계 조회 성공\n');
      
      console.log('📊 뉴스레터 통계:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 총 발송: ${statsData.totalSent?.toLocaleString() || 0}건`);
      console.log(`📭 총 오픈: ${statsData.totalOpened?.toLocaleString() || 0}건`);
      console.log(`🖱️  총 클릭: ${statsData.totalClicked?.toLocaleString() || 0}건`);
      console.log(`📈 오픈율: ${statsData.openRate ? (statsData.openRate * 100).toFixed(1) : 0}%`);
      console.log(`📈 클릭률: ${statsData.clickRate ? (statsData.clickRate * 100).toFixed(1) : 0}%`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    console.log('🎉 Stibee API 연결이 정상적으로 작동합니다!');
    console.log('이제 애플리케이션의 "성과 분석" → "뉴스레터 분석" 탭에서');
    console.log('실제 데이터를 확인할 수 있습니다.\n');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testConnection();
