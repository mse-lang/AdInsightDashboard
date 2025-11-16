# VS-AMS 빠른 시작 가이드

## 1. Airtable 설정

### 1.1 Airtable 베이스 생성
1. [Airtable](https://airtable.com) 로그인
2. "+ Create" → "Start from scratch" 선택
3. 베이스 이름: `VS-AMS Production` 입력

### 1.2 Personal Access Token 발급
1. 우측 상단 프로필 아이콘 → Account 클릭
2. 좌측 메뉴에서 "Developer" 선택
3. "Personal access tokens" → "Create token" 클릭
4. Token 이름: `VS-AMS API` 입력
5. Scopes 선택:
   - ✅ `data.records:read`
   - ✅ `data.records:write`
   - ✅ `schema.bases:read`
   - ✅ `schema.bases:write`
6. Access 선택:
   - "Add a base" → `VS-AMS Production` 선택
7. "Create token" 클릭
8. **토큰 복사** (한 번만 표시됨!)

### 1.3 Base ID 확인
1. 생성한 베이스 열기
2. URL에서 Base ID 복사:
   ```
   https://airtable.com/appXXXXXXXXXXXXXX/...
                        ^^^^^^^^^^^^^^^^^ (이 부분)
   ```

### 1.4 Replit Secrets에 추가
1. Replit 좌측 메뉴 → 🔒 Secrets 클릭
2. 다음 두 개 추가:
   ```
   AIRTABLE_API_KEY=pat.xxxxxxxxxxxxxxxxxx
   AIRTABLE_BASE_ID=appxxxxxxxxxxxxxxxxxx
   ```

### 1.5 자동 테이블 생성 실행
터미널에서 실행:
```bash
npm run setup:airtable
```

예상 출력:
```
🚀 VS-AMS Airtable Base Setup
================================

Base ID: appxxxxxxxxxx

Step 1: Creating tables...

📝 Creating table: Users...
✅ Created: Users (tblxxxxx)
📝 Creating table: Advertisers...
✅ Created: Advertisers (tblxxxxx)
...

🔗 Adding relationship fields...
  ✅ Added Account Manager
  ✅ Added Advertiser
  ...

✅ Airtable base setup complete!
```

---

## 2. Google Cloud 설정

상세 가이드: [`docs/GOOGLE_CLOUD_SETUP.md`](./GOOGLE_CLOUD_SETUP.md) 참조

### 빠른 체크리스트

#### 2.1 OAuth 클라이언트 생성
- [ ] Google Cloud Console 접속
- [ ] OAuth 동의 화면 구성
- [ ] OAuth 클라이언트 ID 생성
- [ ] 클라이언트 ID/Secret 복사

#### 2.2 필요한 API 활성화
- [ ] Google Calendar API
- [ ] Gmail API  
- [ ] Google Analytics Data API

#### 2.3 환경 변수 추가
Replit Secrets에 추가:
```
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx
GOOGLE_CALENDAR_ID=xxxxxxxxxx@group.calendar.google.com
GA4_PROPERTY_ID=123456789
SESSION_SECRET=random-generated-secret
```

---

## 3. 애플리케이션 시작

### 3.1 개발 서버 실행
```bash
npm run dev
```

### 3.2 로그인 테스트
1. 브라우저에서 `/login` 접속
2. "Google로 로그인" 클릭
3. `mse@venturesquare.net` 또는 `rosie@venturesquare.net` 계정 선택
4. 권한 승인
5. 대시보드 확인

---

## 4. Solapi 설정 (Phase 2)

### 4.1 Solapi 계정 생성
1. [Solapi](https://www.solapi.com) 회원가입
2. API Key 발급:
   - 대시보드 → API Keys → "Create New Key"
   - API Key와 API Secret 복사

### 4.2 환경 변수 추가
```
SOLAPI_API_KEY=NCSxxxxxxxxxx
SOLAPI_API_SECRET=xxxxxxxxxx
```

---

## 5. 문제 해결

### Airtable 연결 오류
```
Error: Invalid API key
```
**해결**: AIRTABLE_API_KEY가 올바른지 확인, `pat.`로 시작해야 함

### Google OAuth 오류
```
redirect_uri_mismatch
```
**해결**: Google Cloud Console에서 Redirect URI 확인
- `https://[your-replit-url].replit.dev/api/auth/google/callback`

### 테이블 생성 실패
```
❌ Failed to create table
```
**해결**: 
1. Airtable Personal Access Token의 권한 확인
2. Base가 비어있는지 확인 (기존 테이블 삭제)

---

## 6. 다음 단계

설정 완료 후:

1. ✅ **Phase 1**: Airtable + Google OAuth 완료
2. 🔄 **Phase 2**: 광고주 관리 + Solapi 연동 개발 시작
3. ⏳ **Phase 3**: 캠페인 관리 + Google 연동
4. ⏳ **Phase 4**: GA4 + 자동화

---

## 참고 문서

- [요구사항 정의서](./requirements/VS-AMS-requirements.md)
- [Airtable 스키마](./AIRTABLE_SCHEMA.md)
- [Google Cloud 설정](./GOOGLE_CLOUD_SETUP.md)
- [마이그레이션 가이드](./MIGRATION_GUIDE.md)

---

**도움이 필요하신가요?**  
문제가 발생하면 에러 메시지와 함께 문의해주세요.
