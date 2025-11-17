# 🚀 VS-AMS 배포 체크리스트

## 📋 개요

이 문서는 VS-AMS를 프로덕션 환경에 배포하기 위한 단계별 체크리스트입니다.

**최종 업데이트**: 2025-11-16  
**대상 환경**: Replit, AWS, GCP, Azure 등

---

## ✅ 배포 전 준비사항

### 1️⃣ Airtable 설정

- [ ] **Airtable 계정 생성**
  - https://airtable.com/signup 에서 가입
  - 워크스페이스 생성

- [ ] **Base 생성**
  - 새 Base 생성: "VS-AMS Production"
  - Base ID 확인 (URL에서 `app` 뒤의 문자열)

- [ ] **테이블 생성** (총 13개)
  ```
  ✓ Users
  ✓ Agencies
  ✓ Advertisers
  ✓ Communication_Logs
  ✓ Ad_Products
  ✓ Campaigns
  ✓ Creatives
  ✓ Creative_Variants
  ✓ Quotes
  ✓ Quote_Items
  ✓ Invoices
  ✓ Reports
  ✓ System_Settings
  ```

- [ ] **API Key 발급**
  - https://airtable.com/account 접속
  - API 섹션에서 API Key 생성
  - 안전한 곳에 보관

- [ ] **테이블 스키마 설정**
  - 각 테이블의 필드 타입 확인
  - 참조: `server/airtable/types.ts`

**테스트 방법**:
```bash
export AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
export AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
npm run test:airtable
```

---

### 2️⃣ Google OAuth 설정

- [ ] **Google Cloud Project 생성**
  - https://console.cloud.google.com 접속
  - 새 프로젝트 생성: "VS-AMS Production"

- [ ] **OAuth 2.0 클라이언트 ID 생성**
  1. APIs & Services > Credentials
  2. CREATE CREDENTIALS > OAuth 2.0 Client ID
  3. Application type: Web application
  4. Name: "VS-AMS OAuth"

- [ ] **승인된 리디렉션 URI 설정**
  ```
  https://your-domain.com/api/auth/google/callback
  http://localhost:5000/api/auth/google/callback (개발용)
  ```

- [ ] **클라이언트 ID & Secret 저장**
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET

**테스트 방법**:
```bash
# 서버 실행 후
curl http://localhost:5000/api/auth/google
# 리다이렉션 확인
```

---

### 3️⃣ 커뮤니케이션 서비스 설정

#### Resend (이메일)

- [ ] **Resend 계정 생성**
  - https://resend.com/signup

- [ ] **도메인 인증**
  - 발송할 이메일 도메인 추가
  - DNS 레코드 설정

- [ ] **API Key 생성**
  - RESEND_API_KEY 저장

**테스트 방법**:
```bash
curl -X POST http://localhost:5000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### Solapi (SMS/KakaoTalk)

- [ ] **Solapi 계정 생성**
  - https://console.solapi.com

- [ ] **API Key 발급**
  - SOLAPI_API_KEY
  - SOLAPI_API_SECRET

- [ ] **충전 및 테스트**
  - 잔액 충전
  - 테스트 문자 발송

**테스트 방법**:
```bash
curl http://localhost:5000/api/solapi/balance
```

---

### 4️⃣ Analytics 설정

#### Google Analytics 4

- [ ] **GA4 속성 생성**
  - https://analytics.google.com
  - 새 속성 생성

- [ ] **측정 ID 확인**
  - 관리 > 데이터 스트림
  - 측정 ID (G-XXXXXXXXXX) 복사
  - VITE_GA_MEASUREMENT_ID 설정

#### Stibee (뉴스레터)

- [ ] **Stibee 계정**
  - https://stibee.com
  - API 토큰 발급
  - STIBEE_ACCESS_TOKEN 설정

---

### 5️⃣ BaroBill (선택)

- [ ] **BaroBill 계정**
  - https://www.barobill.co.kr
  - 전자세금계산서 서비스 신청

- [ ] **인증서 설정**
  - BAROBILL_CERT_KEY
  - BAROBILL_CORP_NUM
  - BAROBILL_ID
  - BAROBILL_PWD

---

## 🔐 환경 변수 설정

### 필수 환경 변수

```bash
# 세션 보안 (필수)
SESSION_SECRET=<랜덤 64자 이상 문자열>

# Airtable (필수)
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# 애플리케이션 (필수)
NODE_ENV=production
PORT=5000
ADMIN_EMAIL=ad@venturesquare.net
```

### 권장 환경 변수

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback

# 이메일
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@venturesquare.net

# SMS/KakaoTalk
SOLAPI_API_KEY=xxx
SOLAPI_API_SECRET=xxx

# Analytics
VITE_GA_MEASUREMENT_ID=G-xxx
```

**SESSION_SECRET 생성 방법**:
```bash
openssl rand -base64 64
```

---

## 🏗️ 빌드 및 배포

### 로컬 빌드 테스트

```bash
# 1. 의존성 설치
npm ci

# 2. 타입 체크 (경고 무시 가능)
npm run check

# 3. 빌드
npm run build

# 4. 빌드 결과 확인
ls -lh dist/
# ✓ dist/index.js (서버)
# ✓ dist/public/ (클라이언트)

# 5. 프로덕션 테스트
npm start
```

---

### Replit 배포

- [ ] **환경 변수 설정**
  1. Secrets (자물쇠 아이콘) 클릭
  2. 모든 환경 변수 추가

- [ ] **도메인 설정**
  1. Webview URL 확인
  2. GOOGLE_CALLBACK_URL 업데이트

- [ ] **Run 버튼 클릭**
  - `.replit` 파일이 자동으로 빌드 및 실행

**배포 URL**: `https://<repl-name>.<username>.repl.co`

---

### 일반 서버 배포 (AWS/GCP/Azure)

#### 1. 서버 준비

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm git

# Node.js 20 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 설치 (프로세스 관리)
sudo npm install -g pm2
```

#### 2. 프로젝트 클론 및 설정

```bash
# 클론
git clone https://github.com/mse-lang/AdInsightDashboard.git
cd AdInsightDashboard

# 의존성 설치
npm ci

# 환경 변수 설정
cp .env.example .env
nano .env
# 모든 환경 변수 입력

# 빌드
npm run build
```

#### 3. PM2로 실행

```bash
# 프로덕션 실행
pm2 start npm --name "vs-ams" -- start

# 부팅 시 자동 시작
pm2 startup
pm2 save

# 로그 확인
pm2 logs vs-ams

# 상태 확인
pm2 status
```

#### 4. Nginx 리버스 프록시 (선택)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 배포 후 테스트

### 1. 서버 헬스 체크

```bash
curl https://your-domain.com/api/auth/user
# 예상 응답: {"user":null} 또는 {"user":{...}}
```

### 2. Airtable 연결 확인

```bash
curl https://your-domain.com/api/advertisers
# Airtable 설정 시: 광고주 목록 반환
# Airtable 미설정 시: {"error":"Airtable not configured"}
```

### 3. Google OAuth 테스트

```bash
# 브라우저에서 접속
https://your-domain.com/api/auth/google
# Google 로그인 화면으로 리다이렉션 확인
```

### 4. API 자동 테스트

```bash
# 서버에서 직접 실행
npm run test:api
```

### 5. 프론트엔드 접속

```bash
# 브라우저에서 접속
https://your-domain.com
# 로그인 화면 확인
```

---

## 📊 모니터링 설정

### 로그 모니터링

```bash
# PM2 로그
pm2 logs vs-ams --lines 100

# 실시간 로그
tail -f ~/.pm2/logs/vs-ams-out.log
tail -f ~/.pm2/logs/vs-ams-error.log
```

### 성능 모니터링

```bash
# PM2 모니터링
pm2 monit

# 시스템 리소스
pm2 status
```

### 에러 알림 (선택)

- [ ] **Sentry 설정**
  - https://sentry.io
  - 프로젝트 생성 및 DSN 설정

- [ ] **Uptime 모니터링**
  - UptimeRobot, Pingdom 등
  - 엔드포인트: `/api/auth/user`

---

## 🔄 업데이트 절차

### 1. 코드 업데이트

```bash
# 최신 코드 pull
cd AdInsightDashboard
git pull origin main

# 의존성 재설치
npm ci

# 재빌드
npm run build
```

### 2. 무중단 재시작

```bash
# PM2 reload (무중단)
pm2 reload vs-ams

# 또는 restart
pm2 restart vs-ams
```

### 3. 검증

```bash
# 헬스 체크
curl https://your-domain.com/api/auth/user

# 로그 확인
pm2 logs vs-ams --lines 50
```

---

## 🆘 문제 해결

### 서버가 시작되지 않음

```bash
# 로그 확인
pm2 logs vs-ams --err

# 환경 변수 확인
pm2 env vs-ams

# 포트 충돌 확인
sudo lsof -i :5000
```

### Airtable 연결 실패

```bash
# API Key 확인
echo $AIRTABLE_API_KEY

# Base ID 확인
echo $AIRTABLE_BASE_ID

# 테스트 스크립트 실행
npm run test:airtable
```

### Google OAuth 실패

- Callback URL 확인
- Client ID/Secret 확인
- 승인된 도메인 확인

---

## ✅ 최종 체크리스트

### 배포 전

- [ ] Airtable Base 설정 완료
- [ ] 모든 환경 변수 설정
- [ ] 로컬 빌드 테스트 성공
- [ ] Git 커밋 및 푸시

### 배포 중

- [ ] 서버에 코드 배포
- [ ] 의존성 설치 완료
- [ ] 프로덕션 빌드 성공
- [ ] 환경 변수 설정 완료

### 배포 후

- [ ] 서버 정상 실행 확인
- [ ] 헬스 체크 성공
- [ ] API 테스트 통과
- [ ] 프론트엔드 접속 가능
- [ ] Google OAuth 로그인 성공
- [ ] 모니터링 설정 완료

---

## 📞 지원

문제 발생 시:
- GitHub Issues: https://github.com/mse-lang/AdInsightDashboard/issues
- Email: ad@venturesquare.net
- 문서: [MIGRATION.md](./MIGRATION.md), [README.md](./README.md)

---

**작성일**: 2025-11-16  
**버전**: 1.0.0  
**상태**: 프로덕션 준비 완료 ✅
