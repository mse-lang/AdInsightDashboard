# 🚀 VS-AMS (Venture Square Ad Management System)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)](https://www.typescriptlang.org/)

**VS-AMS**는 Venture Square의 광고 영업 라이프사이클 전체를 관리하는 종합 광고 관리 시스템입니다.

> 📌 **최신 업데이트**: PostgreSQL에서 Airtable 기반 아키텍처로 완전 마이그레이션 완료 (2025-11-16)

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [환경 설정](#-환경-설정)
- [개발 가이드](#-개발-가이드)
- [API 문서](#-api-문서)
- [배포](#-배포)
- [테스트](#-테스트)
- [문제 해결](#-문제-해결)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

---

## ✨ 주요 기능

### 🎯 핵심 기능
- **광고주/에이전시 관리**: 고객 정보, 연락처, 커뮤니케이션 로그 관리
- **캠페인 관리**: 8단계 파이프라인 워크플로우 (문의 → 입금)
- **견적서 관리**: 자동 견적서 생성, PDF 출력, 다채널 발송 (Email/SMS/KakaoTalk)
- **세금계산서 연동**: BaroBill 전자세금계산서 발행 및 관리
- **성과 분석**: Google Analytics 4, Stibee 뉴스레터 통계
- **일정 관리**: Google Calendar 연동

### 🔐 인증 및 권한
- Google OAuth 2.0 인증
- 역할 기반 접근 제어 (Admin/User/ReadOnly)
- 개발 모드 자동 로그인 지원

### 📱 다채널 커뮤니케이션
- **Email**: Resend API, Gmail API
- **SMS/KakaoTalk**: Solapi 연동
- **뉴스레터**: Stibee API v2 통계

### 📊 외부 통합
- Airtable (Primary Database)
- Google Workspace (OAuth, Calendar, Gmail, GA4)
- BaroBill (전자세금계산서)
- Solapi (SMS/KakaoTalk)
- Resend (Email)

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 18.3 + TypeScript
- **Build Tool**: Vite 5.4
- **UI Library**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Query (TanStack Query)
- **Form Management**: React Hook Form + Zod
- **Routing**: Wouter

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js 4.21
- **Language**: TypeScript 5.6
- **Database**: Airtable (Primary), In-memory Fallback
- **Session**: MemoryStore (Development), Redis recommended (Production)
- **Authentication**: Passport.js + Google OAuth

### DevOps
- **Package Manager**: npm
- **Code Quality**: TypeScript, ESLint
- **Environment**: dotenv
- **Build**: esbuild, Vite

---

## 🚀 시작하기

### 필수 요구사항

- Node.js >= 20.0.0
- npm >= 10.0.0
- Airtable 계정 (프로덕션)
- Google Cloud Project (OAuth 설정용)

### 빠른 시작

```bash
# 1. 저장소 클론
git clone https://github.com/mse-lang/AdInsightDashboard.git
cd AdInsightDashboard

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값 입력

# 4. 개발 서버 실행
npm run dev

# 서버 접속: http://localhost:5000
```

### 개발 모드 (Airtable 없이)

Airtable을 설정하지 않아도 개발 모드로 실행할 수 있습니다:

```bash
# .env에서 DEV_MODE=true 설정
# 서버 실행
npm run dev

# In-memory 저장소가 자동으로 활성화됩니다
# Google OAuth 없이 자동 로그인됩니다
```

---

## ⚙️ 환경 설정

### 필수 환경 변수

```bash
# 세션 관리
SESSION_SECRET=your-super-secret-key

# Airtable (프로덕션 필수)
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# 애플리케이션
NODE_ENV=production
PORT=5000
```

### 선택 환경 변수

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# 이메일
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# SMS/KakaoTalk
SOLAPI_API_KEY=xxx
SOLAPI_API_SECRET=xxx

# Analytics
VITE_GA_MEASUREMENT_ID=G-xxx

# BaroBill
BAROBILL_CERT_KEY=xxx
BAROBILL_CORP_NUM=xxx
```

**전체 환경 변수 목록**: [.env.example](./.env.example) 참조

---

## 👨‍💻 개발 가이드

### 프로젝트 구조

```
AdInsightDashboard/
├── client/                  # Frontend (React)
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # Custom Hooks
│   │   └── lib/            # 유틸리티
│   └── index.html
├── server/                  # Backend (Express)
│   ├── airtable/           # Airtable 통합
│   │   ├── tables/         # 테이블별 CRUD
│   │   └── client.ts       # Airtable 클라이언트
│   ├── services/           # 외부 서비스 통합
│   ├── auth.ts             # 인증 로직
│   ├── routes.ts           # API 라우트
│   └── index.ts            # 서버 엔트리
├── shared/                  # 공유 타입
├── scripts/                 # 유틸리티 스크립트
└── docs/                    # 문서

```

### 개발 명령어

```bash
# 개발 서버 (Hot Reload)
npm run dev

# 타입 체크
npm run check

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# Airtable 연결 테스트
npm run test:airtable

# API 엔드포인트 테스트
npm run test:api
```

### 코딩 규칙

- TypeScript strict mode 사용
- ESLint 규칙 준수
- 컴포넌트는 함수형으로 작성
- API 라우트는 RESTful 패턴 따르기
- 에러 핸들링 필수

---

## 📡 API 문서

### 인증

```
POST   /api/auth/dev-login              개발 모드 로그인
GET    /api/auth/google                 Google OAuth 시작
GET    /api/auth/google/callback        OAuth 콜백
GET    /api/auth/user                   현재 사용자 정보
POST   /api/auth/logout                 로그아웃
```

### 광고주 관리

```
GET    /api/advertisers                 광고주 목록
GET    /api/advertisers/:id             광고주 상세
POST   /api/advertisers                 광고주 생성
PATCH  /api/advertisers/:id             광고주 수정
DELETE /api/advertisers/:id             광고주 삭제
```

### 캠페인 관리

```
GET    /api/campaigns                   캠페인 목록
GET    /api/campaigns/:id               캠페인 상세
POST   /api/campaigns                   캠페인 생성
PATCH  /api/campaigns/:id               캠페인 수정
DELETE /api/campaigns/:id               캠페인 삭제
GET    /api/campaigns/pipeline-counts   파이프라인 집계
```

### 견적서 관리

```
GET    /api/quotes                      견적서 목록
POST   /api/quotes                      견적서 생성
POST   /api/quotes/:id/send-email       이메일 발송
POST   /api/quotes/:id/send-sms         SMS 발송
POST   /api/quotes/:id/send-kakao       카카오톡 발송
```

**전체 API 목록**: 74개 엔드포인트 - [API 문서](./docs/API.md) 참조

---

## 🚢 배포

### Replit 배포

```bash
# .replit 파일이 자동으로 설정 처리
# Run 버튼 클릭으로 배포 가능
```

### 일반 서버 배포

```bash
# 1. 빌드
npm run build

# 2. 환경 변수 설정
export NODE_ENV=production
export PORT=5000
export SESSION_SECRET=xxx
export AIRTABLE_API_KEY=xxx
export AIRTABLE_BASE_ID=xxx

# 3. 프로덕션 실행
npm start
```

### Docker 배포 (선택)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 🧪 테스트

### Airtable 연결 테스트

```bash
npm run test:airtable

# 출력 예시:
# ✅ AIRTABLE_API_KEY: key12345...
# ✅ AIRTABLE_BASE_ID: appXXXXXX
# ✅ Users                     - 10 record(s) found
# ✅ Advertisers               - 25 record(s) found
```

### API 엔드포인트 테스트

```bash
npm run test:api

# 출력 예시:
# ✅ GET /api/auth/user        (200)
# ✅ GET /api/advertisers      (503) - Airtable not configured
# ✅ GET /api/campaigns        (503)
# 🎉 All API endpoints are responding correctly!
```

### 수동 테스트

```bash
# 서버 헬스 체크
curl http://localhost:5000/api/auth/user

# 광고주 목록 조회
curl http://localhost:5000/api/advertisers

# 캠페인 목록 조회
curl http://localhost:5000/api/campaigns
```

---

## ❓ 문제 해결

### "An API key is required to connect to Airtable"

**원인**: AIRTABLE_API_KEY가 설정되지 않음  
**해결**: `.env` 파일에 `AIRTABLE_API_KEY` 설정

### "SESSION_SECRET environment variable is required"

**원인**: SESSION_SECRET이 설정되지 않음  
**해결**: `.env` 파일에 `SESSION_SECRET=your-random-string` 추가

### 광고주 목록이 비어있음

**원인**: Airtable Base에 데이터가 없음  
**해결**: Airtable에서 Advertisers 테이블에 데이터 입력

### Google OAuth 실패

**원인**: Google OAuth 설정 미완료  
**해결**:
1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
2. 승인된 리디렉션 URI 추가
3. `.env`에 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 설정

**전체 문제 해결 가이드**: [MIGRATION.md](./MIGRATION.md#-문제-해결)

---

## 🤝 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드 설정 등
```

---

## 📚 추가 문서

- [마이그레이션 가이드](./MIGRATION.md) - PostgreSQL → Airtable 마이그레이션
- [환경 변수 설정](./.env.example) - 전체 환경 변수 목록
- [아키텍처 문서](./replit.md) - 시스템 아키텍처 상세
- [디자인 가이드라인](./design_guidelines.md) - UI/UX 가이드
- [Solapi 연동 가이드](./SOLAPI_CALENDAR_IMPLEMENTATION.md)

---

## 📞 지원

- **이슈**: [GitHub Issues](https://github.com/mse-lang/AdInsightDashboard/issues)
- **이메일**: ad@venturesquare.net
- **Replit**: https://replit.com/@mse4/AdInsightDashboard

---

## 📜 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 제작

Developed with ❤️ by Venture Square Team

**마지막 업데이트**: 2025-11-16  
**버전**: 1.0.0  
**상태**: ✅ 프로덕션 준비 완료
