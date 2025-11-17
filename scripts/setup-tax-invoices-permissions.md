# Tax_Invoices 권한 설정 가이드

## 📋 문제 상황
현재 `/api/tax-invoices` 엔드포인트에서 403 Forbidden 에러 발생

```
Error: NOT_AUTHORIZED
Message: You are not authorized to perform this operation
Status: 403
```

## 🎯 원인
Airtable API 토큰에 `Tax_Invoices` (또는 `Invoices`) 테이블에 대한 읽기/쓰기 권한이 없음

---

## 🔧 해결 방법

### Step 1: Airtable 토큰 페이지 접속
1. 브라우저에서 https://airtable.com/create/tokens 열기
2. Airtable 계정으로 로그인

### Step 2: 기존 토큰 찾기
현재 사용 중인 토큰을 찾습니다:
- 토큰명: 프로젝트명 (예: "VS-AMS Token")
- 토큰 시작: `pat0xMH7pYT54UDE8...`

### Step 3: 토큰 편집
1. 토큰 오른쪽의 **"Edit"** 버튼 클릭
2. **"Add a scope"** 섹션으로 스크롤

### Step 4: 권한 추가
필요한 Scopes 확인 및 추가:

**필수 Scopes**:
- ✅ `data.records:read` - 레코드 읽기
- ✅ `data.records:write` - 레코드 쓰기
- ✅ `schema.bases:read` - 베이스 스키마 읽기

### Step 5: 테이블 접근 권한 설정
1. **"Add a base"** 섹션으로 스크롤
2. VS-AMS 베이스 (appCywvfjClIvMevV) 선택
3. **테이블 접근 권한** 설정:
   - ✅ All tables (전체 테이블) 권장
   - 또는 개별 테이블 선택:
     - ✅ Invoices
     - ✅ Tax_Invoices (있는 경우)
     - ✅ Advertisers
     - ✅ Campaigns
     - ✅ Quotes
     - 등...

### Step 6: 저장
1. 페이지 하단의 **"Save changes"** 클릭
2. 토큰은 변경되지 않음 (기존 토큰 그대로 사용 가능)

---

## ✅ 검증

### 방법 1: 서버 재시작 후 테스트
```bash
# 서버 재시작
cd /home/user/webapp && npm run dev

# API 테스트
curl http://localhost:5000/api/tax-invoices
```

**예상 결과**: 200 OK + 데이터 배열

### 방법 2: 자동 테스트 실행
```bash
npm run test:api
```

**예상 결과**: `/api/tax-invoices` 테스트 통과

---

## 🔍 Tax_Invoices 테이블 확인

현재 베이스에 Tax_Invoices 테이블이 있는지 확인:

### 방법 1: Airtable 웹에서 확인
1. https://airtable.com 로그인
2. VS-AMS 베이스 열기
3. 좌측 사이드바에서 테이블 목록 확인
4. `Tax_Invoices` 또는 `Invoices` 테이블 존재 여부 확인

### 방법 2: API로 확인
```bash
curl "https://api.airtable.com/v0/meta/bases/appCywvfjClIvMevV/tables" \
  -H "Authorization: Bearer pat0xMH7pYT54UDE8...." \
  | jq -r '.tables[] | .name' | grep -i invoice
```

---

## 📊 Tax_Invoices 테이블 구조

테이블이 없다면 생성이 필요합니다:

### 필수 필드

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `invoice_number` | Single line text | 세금계산서 번호 |
| `issue_date` | Date | 발행일 |
| `supply_value` | Currency | 공급가액 |
| `tax_amount` | Currency | 세액 |
| `total_amount` | Currency | 합계 |
| `supplier_name` | Single line text | 공급자 상호 |
| `supplier_registration_number` | Single line text | 공급자 사업자번호 |
| `buyer_name` | Single line text | 공급받는자 상호 |
| `buyer_registration_number` | Single line text | 공급받는자 사업자번호 |
| `status` | Single select | 상태 (발행완료, 발행대기, 취소 등) |
| `advertiser` | Link to Advertisers | 연결된 광고주 |
| `campaign` | Link to Campaigns | 연결된 캠페인 |
| `created_at` | Created time | 생성일시 |
| `updated_at` | Last modified time | 수정일시 |

### Status 옵션
- `발행완료` (녹색)
- `발행대기` (노란색)
- `취소` (빨간색)
- `역발행` (파란색)

---

## 🔧 트러블슈팅

### 문제 1: 토큰 편집 후에도 403 에러
**원인**: 서버가 재시작되지 않음  
**해결**:
```bash
# 서버 프로세스 종료
pkill -f "tsx server/index.ts"

# 서버 재시작
npm run dev
```

### 문제 2: Invoices vs Tax_Invoices
**원인**: 테이블명 혼동  
**해결**:
- 코드에서 `Tax_Invoices` 테이블을 참조하는지 확인
- Airtable에 실제 테이블명 확인
- 필요시 테이블명 변경 또는 코드 수정

### 문제 3: 토큰이 만료됨
**원인**: Personal Access Token 만료  
**해결**:
1. 새 토큰 생성: https://airtable.com/create/tokens
2. `.env` 파일의 `AIRTABLE_API_KEY` 업데이트
3. 서버 재시작

### 문제 4: 베이스 접근 권한 없음
**원인**: 토큰이 다른 베이스를 참조  
**해결**:
- 토큰의 Base 접근 권한에 `appCywvfjClIvMevV` 포함 확인
- 필요시 "Add a base"에서 VS-AMS 베이스 추가

---

## 📸 스크린샷 가이드

### 토큰 편집 화면 예시
```
┌─────────────────────────────────────────┐
│ Personal Access Token                   │
├─────────────────────────────────────────┤
│ Token name: VS-AMS Token                │
│                                         │
│ Scopes:                                 │
│ ✓ data.records:read                     │
│ ✓ data.records:write                    │
│ ✓ schema.bases:read                     │
│                                         │
│ Access:                                 │
│ Base: VS-AMS (appCywvfjClIvMevV)        │
│   ✓ All tables                          │
│   or                                    │
│   ☐ Select specific tables:            │
│      ✓ Advertisers                      │
│      ✓ Invoices                         │
│      ✓ Tax_Invoices                     │
│      ✓ ...                              │
│                                         │
│ [Save changes]  [Cancel]                │
└─────────────────────────────────────────┘
```

---

## 🔐 보안 권장사항

### 최소 권한 원칙
프로덕션 환경에서는 필요한 최소 권한만 부여:

**개발/테스트**:
- 모든 테이블 접근 (All tables) ✅
- Read + Write 권한 ✅

**프로덕션**:
- 특정 테이블만 선택
- 읽기 전용 토큰 별도 생성 (조회용)
- 쓰기 권한 토큰 분리 (작업용)

### 토큰 관리
- ✅ 토큰을 `.env` 파일에 저장 (Git 제외)
- ✅ 정기적으로 토큰 갱신 (6개월마다)
- ✅ 사용하지 않는 토큰 삭제
- ❌ 토큰을 코드에 하드코딩하지 않기
- ❌ 토큰을 GitHub에 커밋하지 않기

---

## 📚 관련 문서
- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Personal Access Tokens Guide](https://airtable.com/developers/web/guides/personal-access-tokens)
- [AIRTABLE_INTEGRATION.md](../AIRTABLE_INTEGRATION.md)

---

## ✅ 완료 체크리스트

- [ ] Airtable 토큰 페이지 접속
- [ ] 기존 토큰 편집
- [ ] Scopes 확인 (data.records:read, write, schema.bases:read)
- [ ] VS-AMS 베이스 접근 권한 추가
- [ ] Tax_Invoices 테이블 권한 추가
- [ ] 변경사항 저장
- [ ] 서버 재시작
- [ ] API 테스트 통과 확인

