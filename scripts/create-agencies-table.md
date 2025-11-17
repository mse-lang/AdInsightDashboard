# Agencies 테이블 생성 가이드

## 📋 개요
Airtable 베이스에 Agencies (대행사) 테이블을 생성하는 가이드입니다.

## 🎯 테이블 정보
- **테이블명**: `Agencies`
- **용도**: 광고 대행사 정보 관리
- **관계**: Advertisers와 연결 (1:N)

## 📊 필수 필드 구조

### 1. 기본 정보 필드

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| `name` | Single line text | 대행사명 | ✅ | "디지털마케팅컴퍼니" |
| `business_number` | Single line text | 사업자등록번호 | ✅ | "123-45-67890" |
| `representative` | Single line text | 대표자명 | ⚪ | "홍길동" |
| `email` | Email | 대표 이메일 | ✅ | "info@agency.com" |
| `phone` | Phone number | 전화번호 | ✅ | "02-1234-5678" |

### 2. 담당자 정보

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| `contact_person` | Single line text | 담당자명 | ⚪ | "김매니저" |
| `contact_phone` | Phone number | 담당자 연락처 | ⚪ | "010-1234-5678" |
| `contact_email` | Email | 담당자 이메일 | ⚪ | "manager@agency.com" |

### 3. 계약 정보

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| `commission_rate` | Number (Decimal) | 수수료율 (%) | ✅ | 15 |
| `payment_terms` | Single select | 결제 조건 | ⚪ | "월말 정산" |
| `contract_start_date` | Date | 계약 시작일 | ⚪ | 2024-01-01 |
| `contract_end_date` | Date | 계약 종료일 | ⚪ | 2024-12-31 |

### 4. 주소 정보

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| `address` | Long text | 주소 | ⚪ | "서울시 강남구..." |
| `postal_code` | Single line text | 우편번호 | ⚪ | "06234" |

### 5. 계좌 정보

| 필드명 | 타입 | 설명 | 필수 | 예시 |
|--------|------|------|------|------|
| `bank_name` | Single line text | 은행명 | ⚪ | "국민은행" |
| `account_number` | Single line text | 계좌번호 | ⚪ | "123-456-789012" |
| `account_holder` | Single line text | 예금주 | ⚪ | "디지털마케팅컴퍼니" |

### 6. 관계 필드

| 필드명 | 타입 | 설명 | 필수 |
|--------|------|------|------|
| `advertisers` | Link to Advertisers | 연결된 광고주 목록 | ⚪ |
| `campaigns` | Link to Campaigns | 연결된 캠페인 목록 | ⚪ |

### 7. 메타 정보

| 필드명 | 타입 | 설명 | 필수 | 기본값 |
|--------|------|------|------|--------|
| `status` | Single select | 상태 | ⚪ | "Active" |
| `notes` | Long text | 비고 | ⚪ | - |
| `created_at` | Created time | 생성일시 | ✅ | 자동 |
| `updated_at` | Last modified time | 수정일시 | ✅ | 자동 |

### Status 옵션
- `Active` (활성) - 녹색
- `Inactive` (비활성) - 회색
- `Suspended` (보류) - 노란색
- `Terminated` (종료) - 빨간색

### Payment Terms 옵션
- `월말 정산`
- `익월 15일`
- `즉시 정산`
- `협의`

---

## 🔧 생성 절차

### Step 1: Airtable 베이스 접속
1. https://airtable.com 로그인
2. VS-AMS 베이스 (appCywvfjClIvMevV) 선택

### Step 2: 테이블 생성
1. 좌측 사이드바에서 "+" 버튼 클릭
2. "Add or import" → "Create empty table" 선택
3. 테이블 이름: `Agencies` 입력

### Step 3: 필드 추가
위의 필드 구조에 따라 필드를 추가합니다.

**필드 추가 방법**:
1. 열 헤더 옆 "+" 버튼 클릭
2. 필드 타입 선택
3. 필드명 입력
4. 옵션 설정 (Select 타입의 경우 옵션 추가)

### Step 4: View 설정
1. **Grid view** (기본): 전체 데이터 보기
2. **Active Agencies**: 활성 대행사만 필터
   - Filter: `Status = Active`
3. **By Commission**: 수수료율 기준 정렬
   - Sort: `commission_rate` descending

---

## 📝 샘플 데이터

### 샘플 1: 디지털마케팅컴퍼니
```
name: 디지털마케팅컴퍼니
business_number: 123-45-67890
representative: 홍길동
email: info@digitalmc.co.kr
phone: 02-1234-5678
contact_person: 김매니저
contact_phone: 010-1234-5678
commission_rate: 15
status: Active
payment_terms: 월말 정산
```

### 샘플 2: 크리에이티브에이전시
```
name: 크리에이티브에이전시
business_number: 234-56-78901
representative: 이대리
email: contact@creative-agency.com
phone: 02-2345-6789
contact_person: 박팀장
contact_phone: 010-2345-6789
commission_rate: 20
status: Active
payment_terms: 익월 15일
```

### 샘플 3: 미디어바잉코리아
```
name: 미디어바잉코리아
business_number: 345-67-89012
representative: 최사장
email: hello@mediabuying.kr
phone: 02-3456-7890
commission_rate: 12
status: Active
payment_terms: 월말 정산
```

---

## 🔗 Advertisers 테이블 연결

Advertisers 테이블에 Agency 연결 필드가 있는지 확인:
1. Advertisers 테이블 열기
2. `agency_id` 또는 `agency` 필드 확인
3. 없으면 추가: Link to Agencies 타입

---

## ✅ 검증

테이블 생성 후 다음을 확인:

1. **API 테스트**
```bash
npm run test:airtable
```

2. **수동 확인**
```bash
curl http://localhost:5000/api/agencies
```

3. **예상 응답**: 200 OK + 데이터 배열

---

## 🔧 트러블슈팅

### 문제: API에서 403 에러
**원인**: API 토큰에 Agencies 테이블 권한 없음  
**해결**: 
1. https://airtable.com/create/tokens
2. 토큰 편집
3. Agencies 테이블 읽기/쓰기 권한 추가
4. 서버 재시작

### 문제: 필드명 불일치
**원인**: 코드의 필드명과 Airtable 필드명 다름  
**해결**: 
- Airtable 필드명을 정확히 `name`, `email` 등으로 설정
- 또는 서버 코드에서 필드 매핑 수정

---

## 📚 관련 문서
- [AIRTABLE_INTEGRATION.md](../AIRTABLE_INTEGRATION.md)
- [Server Code: server/airtable/tables/agencies.ts](../server/airtable/tables/agencies.ts)

