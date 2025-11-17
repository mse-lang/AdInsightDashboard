# Pricings 테이블 설정 및 데이터 마이그레이션 가이드

## 📋 개요

이전 PostgreSQL 데이터베이스의 `adSlots` 테이블 데이터를 Airtable의 `Pricings` 테이블로 마이그레이션하는 가이드입니다.

---

## 🎯 목적

**Pricings 테이블**은 광고 상품의 단가를 관리하는 핵심 테이블입니다:
- ✅ 견적서 생성 시 상품 선택 및 가격 자동 입력
- ✅ 세금계산서 발행 시 품목 정보 참조
- ✅ 단가표 중앙 관리 (설정 페이지)

---

## 🛠️ Step 1: Airtable 테이블 생성

### 1-1. Airtable 베이스 접속

1. https://airtable.com 로그인
2. VS-AMS 베이스 (Base ID: `appCywvfjClIvMevV`) 선택
3. 좌측 사이드바에서 "Add or import" 클릭

### 1-2. Pricings 테이블 생성

**테이블명**: `Pricings`

**필드 구조** (5개 필드):

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| `ProductName` | Single line text | 상품명 | ✅ | "네이버 메인 배너" |
| `ProductKey` | Single line text | 상품 키 (고유 식별자) | ✅ | "naver_main_banner" |
| `Price` | Single line text | 단가 (숫자만, 쉼표 없음) | ✅ | "2400000" |
| `Specs` | Long text | 규격/사양 | ❌ | "PC: 1900×400px, Mobile: 600×300px" |
| `Description` | Long text | 상품 설명 | ❌ | "네이버 메인 페이지 상단 배너 광고 (월 단위)" |

### 1-3. 필드 생성 절차

1. **ProductName 필드**:
   - 필드 타입: "Single line text"
   - 필드명: `ProductName`

2. **ProductKey 필드**:
   - 필드 타입: "Single line text"
   - 필드명: `ProductKey`

3. **Price 필드**:
   - 필드 타입: "Single line text" (Number 아님!)
   - 필드명: `Price`
   - ⚠️ 주의: 큰 숫자 처리 위해 Text 타입 사용

4. **Specs 필드**:
   - 필드 타입: "Long text"
   - 필드명: `Specs`

5. **Description 필드**:
   - 필드 타입: "Long text"
   - 필드명: `Description`

---

## 🔐 Step 2: Personal Access Token 권한 설정

### 2-1. 토큰 권한 추가

1. https://airtable.com/create/tokens 접속
2. 현재 사용 중인 토큰 선택 (예: "VS-AMS Token")
3. **"Add a base"** 클릭
4. VS-AMS 베이스 선택
5. **Scopes (권한) 설정**:
   - ✅ `data.records:read` (Pricings 테이블)
   - ✅ `data.records:write` (Pricings 테이블)
   - ✅ `schema.bases:read` (선택사항)
6. **Tables** 섹션에서:
   - "All tables" 선택 (권장)
   - 또는 개별적으로 "Pricings" 테이블만 선택
7. **"Save"** 클릭

### 2-2. 권한 확인

```bash
# 터미널에서 권한 테스트
cd /home/user/webapp
npx tsx -e "
import Airtable from 'airtable';
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
base('Pricings').select({ maxRecords: 1 }).all()
  .then(() => console.log('✅ Pricings 테이블 접근 성공'))
  .catch(e => console.error('❌ 권한 오류:', e.message));
"
```

**예상 결과**:
- ✅ 성공: `✅ Pricings 테이블 접근 성공`
- ❌ 실패: `❌ 권한 오류: You are not authorized...`

---

## 📦 Step 3: 샘플 데이터 입력

### 3-1. 시드 스크립트 실행

준비된 15개 샘플 광고 상품 데이터를 자동 입력합니다:

```bash
cd /home/user/webapp
npx tsx scripts/seed-pricings.ts
```

**예상 출력**:
```
🌱 Seeding Pricings table...

1️⃣ Checking Pricings table access...
   ✅ Pricings table accessible (0 existing records)

2️⃣ Creating pricing records...
   ✅ Created 10 records (10/15)
   ✅ Created 5 records (15/15)

✅ Success! Created 15 pricing records

📊 Created products:
   1. 네이버 메인 배너 - ₩2,400,000
   2. 네이버 DA 광고 - ₩3,000,000
   3. 카카오 DA 광고 - ₩3,500,000
   ...
```

### 3-2. 포함된 샘플 데이터

시드 스크립트에 포함된 15개 광고 상품:

| 번호 | 상품명 | 단가 | 설명 |
|-----|--------|------|------|
| 1 | 네이버 메인 배너 | ₩2,400,000 | 네이버 메인 페이지 상단 배너 |
| 2 | 네이버 DA 광고 | ₩3,000,000 | 네이버 디스플레이 광고 |
| 3 | 카카오 DA 광고 | ₩3,500,000 | 카카오 디스플레이 광고 |
| 4 | 카카오톡 채널 배너 | ₩2,000,000 | 카카오톡 채널 상단 배너 |
| 5 | 구글 디스플레이 광고 | ₩2,800,000 | Google Display Network |
| 6 | 구글 검색 광고 | ₩3,200,000 | Google Search Ads (CPC) |
| 7 | 유튜브 영상 광고 | ₩4,000,000 | YouTube 인스트림 광고 |
| 8 | 페이스북 광고 | ₩2,500,000 | Facebook Ads Manager |
| 9 | 인스타그램 광고 | ₩2,500,000 | Instagram 피드/스토리 광고 |
| 10 | 벤처스퀘어 메인 배너 | ₩1,500,000 | 메인 페이지 배너 |
| 11 | 벤처스퀘어 사이드 배너 | ₩1,000,000 | 사이드바 배너 |
| 12 | 벤처스퀘어 기사형 광고 | ₩2,000,000 | PR 기사 게재 |
| 13 | 리타게팅 광고 패키지 | ₩5,000,000 | 멀티 채널 리타게팅 |
| 14 | 브랜딩 캠페인 패키지 | ₩10,000,000 | 종합 브랜딩 캠페인 |
| 15 | 모바일 앱 광고 | ₩3,500,000 | 앱 마케팅 캠페인 |

### 3-3. 수동 데이터 입력 (선택사항)

시드 스크립트 대신 Airtable UI에서 직접 입력:

1. Airtable에서 Pricings 테이블 열기
2. "Add record" 버튼 클릭
3. 각 필드 입력:
   ```
   ProductName: 네이버 메인 배너
   ProductKey: naver_main_banner
   Price: 2400000
   Specs: PC: 1900×400px, Mobile: 600×300px
   Description: 네이버 메인 페이지 상단 배너 광고 (월 단위)
   ```
4. Enter 키로 저장 후 다음 레코드 입력

---

## ✅ Step 4: 설정 페이지에서 확인

### 4-1. 단가 관리 페이지 접속

1. 브라우저에서 서버 접속:
   ```
   https://5000-<your-sandbox-id>.sandbox.novita.ai
   ```

2. 로그인 (Google OAuth)

3. 좌측 메뉴 → **"설정"** 클릭

4. **"단가 관리"** 탭 선택

### 4-2. 확인 사항

- ✅ 입력한 상품 목록이 표시됨
- ✅ 가격이 ₩ 형식으로 포맷팅됨
- ✅ 규격/설명 정보 확인 가능
- ✅ 상품 추가/수정/삭제 가능

---

## 🧪 Step 5: 견적서 생성 테스트

### 5-1. 견적서 생성

1. 좌측 메뉴 → **"견적서"** 클릭
2. **"견적서 생성"** 버튼 클릭
3. 광고주 선택 (검색 가능)
4. **"광고 상품"** 드롭다운 클릭
5. ✅ Pricings 테이블의 상품 목록이 표시됨
6. 상품 선택 시:
   - 가격이 자동 입력됨
   - 규격과 설명이 함께 표시됨

### 5-2. 세금계산서 발행 테스트

1. 좌측 메뉴 → **"세금계산서 관리"** 클릭
2. **"세금계산서 발행"** 버튼 클릭
3. 광고주 선택 (검색 가능)
4. ✅ 광고주의 사업자 정보가 자동 입력됨
5. ✅ "최근 견적서" 섹션이 표시됨 (있을 경우)
6. 견적서 클릭 시:
   - 품목이 자동으로 입력됨
   - 수량, 단가, 공급가액 자동 계산

---

## 🐛 트러블슈팅

### 문제 1: "NOT_AUTHORIZED" 오류

**증상**:
```
❌ Error seeding pricings: You are not authorized to perform this operation
```

**원인**: Personal Access Token에 Pricings 테이블 권한 없음

**해결**:
1. https://airtable.com/create/tokens 접속
2. 토큰 편집
3. "Add a base" → VS-AMS 선택
4. Permissions 추가:
   - `data.records:read`
   - `data.records:write`
5. Tables: "All tables" 또는 "Pricings" 선택
6. "Save" 클릭

### 문제 2: "Table not found" 오류

**증상**:
```
❌ Error seeding pricings: Could not find table Pricings
```

**원인**: Pricings 테이블이 Airtable에 존재하지 않음

**해결**:
1. Airtable에서 VS-AMS 베이스 열기
2. "Add or import" 클릭
3. "Create blank table"
4. 테이블명: `Pricings` (대소문자 정확히)
5. 필드 구조 생성 (위 Step 1 참고)

### 문제 3: 설정 페이지에 상품이 안 보임

**증상**: 단가 관리 탭이 비어있음

**확인 사항**:
1. 브라우저 콘솔 열기 (F12)
2. Network 탭에서 `/api/pricings` 요청 확인
3. 응답 코드 확인:
   - 200: 정상 (빈 배열 `[]` 반환 = 데이터 없음)
   - 403: 권한 오류
   - 404: 테이블 없음
   - 500: 서버 오류

**해결**:
```bash
# API 직접 테스트
curl http://localhost:5000/api/pricings

# 빈 배열 반환 시: 데이터 입력 필요
# 오류 반환 시: 오류 메시지 확인 후 해결
```

### 문제 4: "INVALID_VALUE_FOR_COLUMN" 오류

**증상**:
```
❌ Error: INVALID_VALUE_FOR_COLUMN
Field "Price" accepts single line text, but received number
```

**원인**: Price 필드 타입이 Number로 설정됨

**해결**:
1. Airtable에서 Pricings 테이블 열기
2. Price 필드 헤더 클릭
3. "Edit field" 선택
4. Field type을 **"Single line text"**로 변경
5. "Save" 클릭

### 문제 5: 견적서에서 상품이 안 보임

**증상**: 견적서 생성 시 "광고 상품" 드롭다운이 비어있음

**확인**:
1. 설정 → 단가 관리에서 상품 확인
2. 최소 1개 이상의 상품이 있어야 함
3. 브라우저 새로고침 (Ctrl+F5)

**해결**:
```bash
# 데이터 확인
curl http://localhost:5000/api/pricings | jq 'length'

# 0이 나오면 데이터 입력 필요
npx tsx scripts/seed-pricings.ts
```

---

## 📊 데이터 마이그레이션 체크리스트

완료 여부를 체크하세요:

- [ ] Airtable에 Pricings 테이블 생성
- [ ] 5개 필드 정확히 생성 (ProductName, ProductKey, Price, Specs, Description)
- [ ] Personal Access Token에 Pricings 테이블 권한 추가
- [ ] 시드 스크립트 실행 성공 (또는 수동 데이터 입력)
- [ ] 설정 → 단가 관리에서 상품 목록 확인
- [ ] 견적서 생성에서 상품 선택 가능 확인
- [ ] 세금계산서 발행에서 견적서 로드 테스트

---

## 🎯 마이그레이션 완료 후

### 데이터 활용

1. **견적서 생성**:
   - 광고주 선택 → 상품 선택 → 수량 입력 → 자동 계산
   - 여러 상품 조합 가능
   - 할인율 적용 가능

2. **세금계산서 발행**:
   - 광고주 선택 → 최근 견적서 자동 로드
   - 견적서 클릭 → 품목 자동 입력
   - 수동 품목 추가/수정 가능

3. **단가표 중앙 관리**:
   - 설정 → 단가 관리에서 언제든 수정 가능
   - 변경 사항이 즉시 견적서/세금계산서에 반영

### 추가 상품 입력

새로운 광고 상품 추가 방법:

**방법 1: 설정 페이지 (UI)**
1. 설정 → 단가 관리
2. "추가 상품" 버튼 클릭
3. 정보 입력 후 "추가" 클릭

**방법 2: Airtable 직접 입력**
1. Airtable에서 Pricings 테이블 열기
2. "Add record" 클릭
3. 정보 입력 후 Enter

**방법 3: API 호출 (프로그래밍)**
```bash
curl -X POST http://localhost:5000/api/pricings \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "신규 광고 상품",
    "productKey": "new_product",
    "price": "5000000",
    "specs": "상세 규격",
    "description": "상품 설명"
  }'
```

---

## 📚 관련 문서

- [견적서 생성 기능 가이드](./QUOTE_IMPROVEMENTS.md)
- [세금계산서 발행 가이드](./TAX_INVOICE_IMPROVEMENTS.md) (작성 예정)
- [Airtable Integration 상태](./AIRTABLE_INTEGRATION.md)
- [전체 마이그레이션 가이드](../MIGRATION.md)

---

## ✅ 완료

Pricings 테이블 설정 및 데이터 마이그레이션이 완료되었습니다!

**다음 단계**:
1. 실제 광고 상품 데이터로 교체
2. 가격 정책 반영
3. 상품 카테고리 추가 (선택사항)
4. 계절별/프로모션 가격 관리 (선택사항)

**질문이나 문제가 있으시면** 이 가이드를 참고하거나, 트러블슈팅 섹션을 확인하세요.
