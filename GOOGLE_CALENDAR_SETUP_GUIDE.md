# Google Calendar 연동 설정 가이드

VS-AMS에서 Google Calendar 기능을 사용하려면 Google Service Account를 생성하고 캘린더에 접근 권한을 부여해야 합니다.

## 📋 목차
1. [Google Cloud Console 설정](#1-google-cloud-console-설정)
2. [Service Account 생성](#2-service-account-생성)
3. [Service Account Key 생성](#3-service-account-key-생성)
4. [캘린더 공유 설정](#4-캘린더-공유-설정)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [연동 테스트](#6-연동-테스트)

---

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성 또는 선택
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 기존 프로젝트를 선택하거나 새 프로젝트를 생성
3. 프로젝트 이름: 예) `vs-ams-calendar`

### 1.2 Google Calendar API 활성화
1. 좌측 메뉴에서 **"API 및 서비스" > "라이브러리"** 클릭
2. 검색창에서 **"Google Calendar API"** 검색
3. **"Google Calendar API"** 클릭 후 **"사용 설정"** 버튼 클릭

---

## 2. Service Account 생성

### 2.1 Service Account 만들기
1. 좌측 메뉴에서 **"API 및 서비스" > "사용자 인증 정보"** 클릭
2. 상단의 **"+ 사용자 인증 정보 만들기"** 클릭
3. **"서비스 계정"** 선택

### 2.2 Service Account 정보 입력
1. **서비스 계정 이름**: `vs-ams-calendar-service`
2. **서비스 계정 ID**: 자동 생성됨 (예: `vs-ams-calendar-service@project-id.iam.gserviceaccount.com`)
3. **서비스 계정 설명**: `VS-AMS Google Calendar 연동용 서비스 계정`
4. **"만들기 및 계속하기"** 클릭
5. 역할 선택은 건너뛰기 (선택사항)
6. **"완료"** 클릭

### 2.3 Service Account Email 복사
생성된 Service Account의 이메일 주소를 복사하세요.
- 형식: `vs-ams-calendar-service@project-id.iam.gserviceaccount.com`
- 이 이메일 주소는 나중에 캘린더 공유 시 사용됩니다.

---

## 3. Service Account Key 생성

### 3.1 Key 생성하기
1. **"API 및 서비스" > "사용자 인증 정보"**에서 방금 만든 Service Account 클릭
2. 상단의 **"키"** 탭 클릭
3. **"키 추가" > "새 키 만들기"** 클릭
4. **키 유형**: **JSON** 선택
5. **"만들기"** 클릭

### 3.2 JSON Key 파일 다운로드
- JSON 파일이 자동으로 다운로드됩니다
- 파일명 예: `project-id-1234567890ab.json`
- **⚠️ 이 파일은 매우 중요합니다! 안전하게 보관하세요.**

### 3.3 JSON 파일 내용 확인
다운로드한 JSON 파일을 열면 다음과 같은 내용이 있습니다:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "vs-ams-calendar-service@project-id.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**필요한 정보:**
- `client_email`: Service Account 이메일
- `private_key`: Private Key (개행 문자 `\n` 포함)

---

## 4. 캘린더 공유 설정

### 4.1 Google Calendar 접속
1. [Google Calendar](https://calendar.google.com/)에 접속
2. 연동할 캘린더 선택 (기본: `mj@venturesquare.net`)

### 4.2 Service Account에 권한 부여
1. 캘린더 좌측 목록에서 연동할 캘린더의 **"설정 및 공유"** 클릭
2. 스크롤하여 **"특정 사용자와 공유"** 섹션으로 이동
3. **"+ 사용자 추가"** 클릭
4. **이메일 주소에 Service Account 이메일 입력**
   - 예: `vs-ams-calendar-service@project-id.iam.gserviceaccount.com`
5. **권한 선택**: **"일정 변경 권한 만들기"** (Make changes to events)
6. **"보내기"** 클릭

### 4.3 캘린더 ID 확인
1. 같은 "설정 및 공유" 페이지에서
2. **"캘린더 통합"** 섹션 찾기
3. **"캘린더 ID"** 복사
   - 예: `mj@venturesquare.net`
   - 기본 캘린더의 경우 이메일 주소와 동일

---

## 5. 환경 변수 설정

### 5.1 `.env` 파일에 추가

프로젝트 루트의 `.env` 파일에 다음 정보를 추가하세요:

```env
# Google Calendar Configuration
GOOGLE_CALENDAR_ID=mj@venturesquare.net
GOOGLE_CALENDAR_CLIENT_EMAIL=vs-ams-calendar-service@project-id.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**⚠️ 주의사항:**
- `GOOGLE_CALENDAR_PRIVATE_KEY`는 반드시 **큰따옴표**로 감싸야 합니다
- Private Key의 `\n` (개행 문자)는 **그대로 유지**해야 합니다
- 실제 Private Key는 매우 길므로 복사-붙여넣기를 사용하세요

### 5.2 환경 변수 형식 예시

**올바른 형식:**
```env
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...(중략)...AgMBAAE=\n-----END PRIVATE KEY-----\n"
```

**잘못된 형식 (❌):**
```env
# 따옴표 없음 - 개행 문자 처리 안됨
GOOGLE_CALENDAR_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...

# 실제 개행 - 환경 변수로 인식 안됨
GOOGLE_CALENDAR_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhki...
-----END PRIVATE KEY-----"
```

---

## 6. 연동 테스트

### 6.1 서버 재시작
환경 변수 변경 후 반드시 서버를 재시작하세요:

```bash
# 개발 서버 재시작
npm run dev
```

### 6.2 연동 확인
1. VS-AMS에 로그인
2. 좌측 사이드바에서 **"광고 캘린더"** 메뉴 클릭
3. Google Calendar 일정이 정상적으로 표시되는지 확인

### 6.3 테스트 캠페인 생성
1. **"캠페인 관리"** 메뉴로 이동
2. **"캠페인 추가"** 버튼 클릭
3. 캠페인 정보 입력 후 저장
4. Google Calendar에 자동으로 일정이 추가되는지 확인

---

## 🔧 문제 해결 (Troubleshooting)

### 에러: "Google Calendar not configured"
**원인:** 환경 변수가 올바르게 설정되지 않음

**해결:**
1. `.env` 파일에 모든 필수 변수가 있는지 확인
2. Private Key가 큰따옴표로 감싸져 있는지 확인
3. 서버를 재시작했는지 확인

### 에러: "403: Google Calendar 접근 권한이 없습니다"
**원인:** Service Account가 캘린더에 공유되지 않음

**해결:**
1. Google Calendar의 "설정 및 공유"에서
2. Service Account 이메일이 추가되어 있는지 확인
3. 권한이 "일정 변경 권한 만들기"인지 확인

### 에러: "401: Unauthorized"
**원인:** Service Account 인증 정보가 잘못됨

**해결:**
1. `client_email`이 정확한지 확인
2. `private_key`가 올바르게 복사되었는지 확인
3. JSON 파일에서 다시 복사하여 붙여넣기

### Private Key 형식 문제
**증상:** 서버 시작 시 에러 발생

**해결:**
```bash
# 올바른 형식으로 변환
echo "GOOGLE_CALENDAR_PRIVATE_KEY=\"$(cat your-key-file.json | jq -r .private_key)\"" >> .env
```

---

## 📚 참고 자료

- [Google Calendar API 문서](https://developers.google.com/calendar/api/guides/overview)
- [Service Account 이해하기](https://cloud.google.com/iam/docs/service-accounts)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## ✅ 설정 체크리스트

- [ ] Google Cloud Console에서 프로젝트 생성/선택
- [ ] Google Calendar API 활성화
- [ ] Service Account 생성
- [ ] Service Account JSON Key 다운로드
- [ ] Service Account 이메일로 캘린더 공유
- [ ] `.env` 파일에 환경 변수 추가
  - [ ] `GOOGLE_CALENDAR_ID`
  - [ ] `GOOGLE_CALENDAR_CLIENT_EMAIL`
  - [ ] `GOOGLE_CALENDAR_PRIVATE_KEY`
- [ ] 서버 재시작
- [ ] VS-AMS에서 캘린더 페이지 확인
- [ ] 테스트 캠페인 생성 및 확인

---

## 💡 보안 권장 사항

1. **Private Key 보안**
   - `.env` 파일을 절대 Git에 커밋하지 마세요
   - `.gitignore`에 `.env`가 포함되어 있는지 확인하세요

2. **Service Account 권한**
   - 필요한 최소한의 권한만 부여하세요
   - 정기적으로 사용하지 않는 Service Account는 삭제하세요

3. **Key 교체**
   - 정기적으로 Service Account Key를 교체하세요 (권장: 6개월~1년)
   - Key가 유출된 경우 즉시 삭제하고 새로 생성하세요

---

**문제가 계속 발생하는 경우, 위 체크리스트를 다시 확인하거나 개발팀에 문의하세요.**
