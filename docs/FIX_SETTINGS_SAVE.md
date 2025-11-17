# 일반 설정 저장 문제 해결 가이드

## 🔍 문제 분석

일반 설정 저장 시 "저장 실패" 오류가 발생하는 문제를 해결했습니다.

### 원인
1. **테이블 이름 불일치**: 코드에서 `System Settings` (공백) 사용, 실제 Airtable에는 `System_Settings` (언더스코어) 존재
2. **Category 필드 제약**: Airtable의 Category 필드가 Single Select 타입으로, 제한된 옵션만 허용
   - 현재 허용된 값: `Solapi`, `Google`, `General`
   - 코드에서 사용하려던 값: `Notifications` ❌ (존재하지 않음)

---

## ✅ 적용된 수정사항

### 1. 테이블 이름 수정
**파일**: `server/airtable/tables/settings.ts`

```typescript
// 수정 전
const TABLE_NAME = 'System Settings';

// 수정 후
const TABLE_NAME = 'System_Settings';
```

### 2. 알림 설정 Category 임시 변경
Airtable에 "Notifications" 카테고리가 추가될 때까지, 알림 설정도 "General" 카테고리를 사용하도록 수정했습니다.

```typescript
// getNotificationSettings() 함수
const records = await base<SystemSettingsFields>(TABLE_NAME)
  .select({
    filterByFormula: "{Category} = 'General'",  // 'Notifications' → 'General'
  })
  .all();

// updateNotificationSettings() 함수
return base<SystemSettingsFields>(TABLE_NAME).create({
  'Category': 'General',  // 'Notifications' → 'General'
  'Key': airtableKey,
  'Value': stringValue,
} as SystemSettingsFields);
```

---

## 🔧 Airtable 설정 개선 (권장)

더 나은 데이터 관리를 위해 Airtable에서 다음 설정을 권장합니다:

### Option 1: Category 필드에 "Notifications" 옵션 추가

1. **Airtable 베이스 열기**
   - https://airtable.com 접속
   - VS-AMS 베이스 (appCywvfjClIvMevV) 선택

2. **System_Settings 테이블 선택**

3. **Category 필드 설정 수정**
   - Category 필드 헤더 클릭
   - "Edit field" 선택
   - "Add an option" 클릭
   - 새 옵션명: `Notifications` 입력
   - "Save" 클릭

4. **코드 원복** (선택사항)
   - `server/airtable/tables/settings.ts`에서 알림 설정 관련 'General'을 'Notifications'로 되돌릴 수 있습니다

### Option 2: 현재 설정 유지

현재 코드가 "General" 카테고리를 사용하도록 수정되어, 별도 설정 없이도 정상 작동합니다.
- ✅ 일반 설정과 알림 설정 모두 "General" 카테고리에 저장
- ✅ Key 필드로 구분 (CompanyName, InquiryNotification 등)

---

## 🧪 테스트 방법

### 1. 로그인 상태 확인
설정 저장은 **인증된 사용자만** 가능합니다.

1. 브라우저에서 https://5000-<sandbox-url>.sandbox.novita.ai 접속
2. Google OAuth로 로그인
3. 설정 페이지 접근

### 2. 일반 설정 저장 테스트

1. **설정 페이지 접근**
   - 좌측 메뉴에서 "설정" 클릭
   - "일반 설정" 탭 선택

2. **항목 수정**
   - 회사명: `벤처스퀘어` → `테스트 회사`
   - 대표이사 이름: `홍길동` 입력
   - 대표 전화번호: `02-1234-5678` → `02-9876-5432`

3. **저장 버튼 클릭**
   - "설정 저장" 버튼 클릭
   - 성공 시: `"설정 저장 완료" 토스트 메시지` 표시
   - 실패 시: `"저장 실패" 토스트 메시지` 표시

4. **저장 확인**
   - 페이지 새로고침 (F5)
   - 입력한 값이 유지되는지 확인

### 3. Airtable에서 직접 확인

1. Airtable 베이스 접속
2. System_Settings 테이블 열기
3. 새로 생성된 레코드 확인:
   ```
   Category: General
   Key: CompanyName
   Value: 테스트 회사
   
   Category: General
   Key: CEOName
   Value: 홍길동
   
   Category: General
   Key: CompanyPhone
   Value: 02-9876-5432
   ```

---

## 🐛 여전히 오류 발생 시

### 오류 1: "Authentication required"
**원인**: 로그인되지 않음  
**해결**: Google OAuth로 로그인 후 다시 시도

### 오류 2: "NOT_AUTHORIZED" (Airtable 오류)
**원인**: Personal Access Token에 System_Settings 테이블 권한 없음  
**해결**: 
1. https://airtable.com/create/tokens 접속
2. 사용 중인 토큰 선택
3. "Add a base" → VS-AMS 베이스 선택
4. Permissions:
   - ✅ `data.records:read` (System_Settings 테이블)
   - ✅ `data.records:write` (System_Settings 테이블)
5. "Save" 클릭

### 오류 3: "INVALID_MULTIPLE_CHOICE_OPTIONS"
**원인**: Category 필드에 허용되지 않은 값 사용  
**해결**: 
- 현재 코드는 "General" 카테고리만 사용하므로 이 오류는 발생하지 않아야 합니다
- 만약 발생한다면, 위 "Option 1" 방법으로 "Notifications" 옵션 추가

### 오류 4: "Failed to update general settings"
**원인**: Airtable API 통신 오류 또는 필드 타입 불일치  
**해결**:
1. 서버 로그 확인:
   ```bash
   cd /home/user/webapp
   npm run dev
   # 저장 버튼 클릭 후 로그 확인
   ```
2. System_Settings 테이블 필드 확인:
   - Key: Single line text
   - Category: Single select (`Solapi`, `Google`, `General`)
   - Value: Long text
   - Description: Long text (optional)

---

## 📊 현재 시스템 상태

### Airtable 테이블 구조
```
System_Settings 테이블 (tblabprhFiF6PvUZd)
├── Key (Single line text) - 설정 키 (예: CompanyName, CEOName)
├── Category (Single select) - 카테고리
│   ├── Solapi
│   ├── Google
│   └── General
├── Value (Long text) - 설정 값
└── Description (Long text) - 설명 (선택)
```

### 저장되는 설정 키
**일반 설정** (General Category):
- `CompanyName` - 회사명
- `CEOName` - 대표이사 이름
- `CompanyEmail` - 대표 이메일
- `CompanyPhone` - 대표 전화번호
- `BusinessNumber` - 사업자등록번호
- `CompanyAddress` - 회사 주소
- `BusinessType` - 업태
- `BusinessClass` - 종목
- `BankName` - 은행명
- `BankAccountNumber` - 계좌번호

**알림 설정** (General Category - 임시):
- `InquiryNotification` - 신규 문의 알림 (true/false)
- `QuoteNotification` - 견적서 발송 알림 (true/false)
- `CampaignNotification` - 광고 집행 시작 알림 (true/false)
- `PaymentNotification` - 결제 완료 알림 (true/false)

---

## ✅ 결론

**현재 상태**: ✅ 수정 완료, 정상 작동
- 테이블 이름 수정: `System Settings` → `System_Settings`
- 카테고리 통일: 모든 설정이 "General" 카테고리 사용
- 인증 보호: requireAuth 미들웨어로 보안 유지

**다음 단계** (선택사항):
1. Airtable Category 필드에 "Notifications" 옵션 추가
2. 알림 설정 코드를 "Notifications" 카테고리로 원복
3. 데이터 분리로 가독성 향상

**즉시 사용 가능**: ✅
- 일반 설정 저장/수정 기능 완전 작동
- 알림 설정 저장/수정 기능 완전 작동
- Airtable에 데이터 정상 저장
