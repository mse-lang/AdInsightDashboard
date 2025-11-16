/**
 * Stibee API 키 확인 스크립트
 * 
 * 사용법: npx tsx scripts/check-stibee-credentials.ts
 */

const apiKey = process.env.STIBEE_API_KEY;

console.log('\n========================================');
console.log('Stibee API 키 확인');
console.log('========================================\n');

if (!apiKey) {
  console.error('❌ STIBEE_API_KEY 환경 변수가 설정되지 않았습니다.');
  console.log('\n설정 방법:');
  console.log('1. https://www.stibee.com 로그인');
  console.log('2. 설정 → API 키 메뉴');
  console.log('3. API 키 생성 또는 복사');
  console.log('4. Replit Secrets에서 STIBEE_API_KEY 추가');
  process.exit(1);
}

console.log('✅ STIBEE_API_KEY 설정됨\n');
console.log('API 키 정보:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🔑 API 키: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`📏 길이: ${apiKey.length} 문자`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('다음 단계: API 연결 테스트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('npx tsx scripts/test-stibee-connection.ts');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
