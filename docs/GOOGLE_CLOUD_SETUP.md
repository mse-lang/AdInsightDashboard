# Google Cloud 설정 가이드

VS-AMS 시스템에서 Google OAuth, Calendar, Gmail, GA4 연동을 위한 상세 설정 가이드입니다.

---

## 1. Google Cloud 프로젝트 생성 (이미 있다면 Skip)

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 상단 프로젝트 선택 드롭다운 클릭
3. "새 프로젝트" 클릭
4. 프로젝트 이름: `VS-AMS` 입력
5. "만들기" 클릭

### 1.2 결제 계정 연결
- 무료 tier로 충분하지만, API 활성화를 위해 결제 계정 연결 필요
- 좌측 메뉴 → "결제" → 결제 계정 생성/연결

---

## 2. OAuth 2.0 클라이언트 ID 설정

### 2.1 OAuth 동의 화면 구성
1. 좌측 메뉴 → **APIs & Services** → **OAuth consent screen**
2. User Type 선택:
   - **Internal** 선택 (벤처스퀘어 조직 내부용)
   - 외부 사용자가 필요하면 **External** 선택
3. "만들기" 클릭

### 2.2 앱 정보 입력
**1단계: OAuth 동의 화면**
- 앱 이름: `VS-AMS`
- 사용자 지원 이메일: `mse@venturesquare.net`
- 앱 로고: (선택사항)
- 앱 도메인:
  - 애플리케이션 홈페이지: `https://[your-replit-url].replit.dev`
  - 개인정보처리방침: (선택사항)
  - 서비스 약관: (선택사항)
- 승인된 도메인:
  - `replit.dev` 추가
- 개발자 연락처 이메일: `mse@venturesquare.net`
- "저장 후 계속" 클릭

**2단계: 범위 (Scopes)**
필요한 범위 추가:
```
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/analytics.readonly
```

범위 추가 방법:
1. "범위 추가 또는 삭제" 클릭
2. 위 URL들을 검색하여 선택
3. "업데이트" 클릭
4. "저장 후 계속" 클릭

**3단계: 테스트 사용자** (External 선택 시만)
- 테스트 사용자 추가:
  - `mse@venturesquare.net`
  - `rosie@venturesquare.net`
- "저장 후 계속" 클릭

### 2.3 OAuth 클라이언트 ID 생성
1. 좌측 메뉴 → **APIs & Services** → **Credentials**
2. 상단 "+ 사용자 인증 정보 만들기" → **OAuth 클라이언트 ID** 선택
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름: `VS-AMS Web Client` 입력
5. **승인된 자바스크립트 원본** 추가:
   ```
   https://[your-replit-url].replit.dev
   ```
   예: `https://vsadmanagesystem.myusername.repl.co`

6. **승인된 리디렉션 URI** 추가:
   ```
   https://[your-replit-url].replit.dev/api/auth/google/callback
   ```
   
7. "만들기" 클릭

### 2.4 클라이언트 ID 및 Secret 저장
- 생성 완료 후 팝업에서 표시되는 정보 복사:
  - **클라이언트 ID**: `xxxxxxxxxx.apps.googleusercontent.com`
  - **클라이언트 보안 비밀**: `GOCSPX-xxxxxxxxxx`
  
⚠️ **중요**: 이 정보를 안전하게 보관하세요!

나중에 다시 확인하려면:
- Credentials 페이지에서 생성한 OAuth 클라이언트 클릭
- 클라이언트 ID는 언제든지 확인 가능
- Secret은 숨겨져 있지만 재생성 가능

---

## 3. 필요한 API 활성화

### 3.1 API 라이브러리에서 활성화
좌측 메뉴 → **APIs & Services** → **Library**

다음 API들을 검색하여 활성화:

#### A. Google Calendar API
1. "Google Calendar API" 검색
2. 클릭 → "사용" 버튼 클릭
3. 용도: 캠페인 일정을 Google Calendar와 동기화

#### B. Gmail API  
1. "Gmail API" 검색
2. 클릭 → "사용" 버튼 클릭
3. 용도: 광고주 이메일 자동 분류 및 발송

#### C. Google Analytics Data API
1. "Google Analytics Data API" 검색
2. 클릭 → "사용" 버튼 클릭
3. 용도: GA4에서 캠페인 성과 데이터 수집

---

## 4. Google Calendar 설정

### 4.1 전용 캘린더 생성
1. [Google Calendar](https://calendar.google.com) 접속
2. 좌측 "다른 캘린더" 옆 "+" 클릭
3. "새 캘린더 만들기" 선택
4. 캘린더 이름: `VS-AMS Campaigns` 입력
5. "캘린더 만들기" 클릭

### 4.2 캘린더 ID 확인
1. 생성한 캘린더 옆 ⋮ (점 3개) 클릭
2. "설정 및 공유" 선택
3. "캘린더 통합" 섹션에서 **캘린더 ID** 복사
   - 형식: `xxxxxxxxxx@group.calendar.google.com`
4. 이 ID를 환경 변수로 저장할 예정

### 4.3 공유 설정 (선택사항)
- 팀 구성원과 공유하려면:
  - "특정 사용자와 공유" → 이메일 추가
  - 권한: "변경 및 공유 관리 권한" 부여

---

## 5. Gmail API 설정

### 5.1 전용 이메일 계정 설정
- **ad@venturesquare.net** 계정이 광고주 커뮤니케이션 전용으로 사용됨
- 이 계정으로 OAuth 인증 필요

### 5.2 Pub/Sub 설정 (나중에 구현)
Phase 3에서 Gmail Watch API를 통해 실시간 이메일 모니터링 구현 예정

---

## 6. Google Analytics 4 설정

### 6.1 GA4 속성 확인
1. [Google Analytics](https://analytics.google.com) 접속
2. 벤처스퀘어 웹사이트의 GA4 속성 선택
3. 좌측 하단 ⚙️ (관리) 클릭

### 6.2 속성 ID 확인
1. "속성 설정" 클릭
2. **속성 ID** 복사 (숫자로만 구성, 예: `123456789`)
3. 이 ID를 환경 변수로 저장할 예정

### 6.3 Data API 액세스 권한
- GA4 Data API는 OAuth로 인증된 계정의 권한을 사용
- `mse@venturesquare.net` 또는 `rosie@venturesquare.net` 계정이 GA4 속성에 대한 읽기 권한 필요
- 권한 확인:
  1. GA4 관리 → "속성 액세스 관리"
  2. 해당 이메일이 "뷰어" 이상 권한 보유 확인

---

## 7. 환경 변수 설정

위에서 수집한 정보를 Replit Secrets에 추가:

### 7.1 Replit에서 설정
1. Replit 프로젝트 좌측 메뉴에서 🔒 **Secrets** 클릭 (또는 🔐 자물쇠 아이콘)
2. 다음 환경 변수 추가:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx

# Google Calendar
GOOGLE_CALENDAR_ID=xxxxxxxxxx@group.calendar.google.com

# Google Analytics 4
GA4_PROPERTY_ID=123456789

# Session Secret (랜덤 문자열)
SESSION_SECRET=random-secret-string-here

# Callback URL (실제 Replit URL로 교체)
GOOGLE_CALLBACK_URL=https://[your-replit-url].replit.dev/api/auth/google/callback
```

### 7.2 Session Secret 생성
터미널에서 실행:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
출력된 문자열을 `SESSION_SECRET`에 사용

---

## 8. OAuth 테스트

### 8.1 로컬 테스트
1. VS-AMS 애플리케이션 시작
2. `/login` 페이지 접속
3. "Google로 로그인" 버튼 클릭
4. Google 계정 선택 (`mse@venturesquare.net` 또는 `rosie@venturesquare.net`)
5. 권한 승인 화면에서 모든 권한 허용
6. 리디렉션 후 대시보드 접속 확인

### 8.2 문제 해결

**오류: redirect_uri_mismatch**
- Google Cloud Console → OAuth 클라이언트 → 승인된 리디렉션 URI 확인
- Replit URL과 정확히 일치해야 함 (trailing slash 주의)

**오류: Access denied**
- OAuth 동의 화면에서 테스트 사용자에 이메일 추가 확인
- 또는 앱을 "프로덕션" 모드로 게시

**오류: Invalid client**
- GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET 확인
- 환경 변수가 올바르게 설정되었는지 확인

---

## 9. API 사용량 모니터링

### 9.1 할당량 확인
1. Google Cloud Console → **APIs & Services** → **Dashboard**
2. 각 API별 사용량 확인
3. 할당량 초과 시 알림 설정 권장

### 9.2 무료 tier 한도
- Calendar API: 1,000,000 requests/day (충분)
- Gmail API: 1,000,000,000 quota units/day (충분)
- GA4 Data API: 50,000 requests/day (충분)

---

## 10. 보안 권장사항

### 10.1 API 키 보안
- ✅ Replit Secrets 사용 (환경 변수)
- ❌ 코드에 하드코딩 금지
- ❌ GitHub에 커밋 금지

### 10.2 OAuth 범위 최소화
- 필요한 범위만 요청
- 사용하지 않는 API는 비활성화

### 10.3 정기 검토
- 분기별 OAuth 동의 화면 및 권한 검토
- 사용하지 않는 OAuth 클라이언트 삭제

---

## 11. 체크리스트

설정 완료 확인:

- [ ] Google Cloud 프로젝트 생성
- [ ] OAuth 동의 화면 구성 완료
- [ ] OAuth 클라이언트 ID 생성
- [ ] 클라이언트 ID/Secret 복사 및 저장
- [ ] Calendar API 활성화
- [ ] Gmail API 활성화
- [ ] GA4 Data API 활성화
- [ ] VS-AMS Campaigns 캘린더 생성
- [ ] 캘린더 ID 복사
- [ ] GA4 속성 ID 확인
- [ ] Replit Secrets에 모든 환경 변수 추가
- [ ] OAuth 로그인 테스트 성공

---

## 다음 단계

Google Cloud 설정이 완료되었다면:
1. Airtable 베이스 설정 진행
2. VS-AMS Phase 1 개발 시작
3. OAuth 인증 구현
4. Calendar/Gmail/GA4 연동 (Phase 3)

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-11-16  
**문의**: VS-AMS 개발팀
