# 🔄 VS-AMS 데이터베이스 마이그레이션 가이드

## 📋 개요

VS-AMS는 PostgreSQL에서 **Airtable 기반 아키텍처**로 완전히 마이그레이션되었습니다.

### 🎯 마이그레이션 목표
- ✅ PostgreSQL 의존성 제거
- ✅ Airtable을 Primary Database로 사용
- ✅ 개발 환경에서 In-Memory Fallback 지원
- ✅ MemoryStore 기반 세션 관리
- ✅ 타입 안전성 유지

---

## 🏗️ 변경 사항

### 1. 데이터베이스 계층

#### ❌ 제거된 것
- `server/db.ts` - PostgreSQL 연결 (사용 안 함)
- `drizzle.config.ts` - Drizzle ORM 설정 (사용 안 함)
- `connect-pg-simple` - PostgreSQL 세션 스토어 (교체됨)
- `@neondatabase/serverless` - Neon PostgreSQL (사용 안 함)

#### ✅ 추가/수정된 것
- `server/auth.ts` - MemoryStore 기반 세션 관리
- `server/airtable/client.ts` - Airtable 연결 및 Fallback 처리
- `server/airtable/tables/*` - 각 테이블별 CRUD 함수
- `server/airtable/memory-store.ts` - 개발용 In-Memory 저장소

### 2. 세션 관리

#### Before (PostgreSQL 기반)
```typescript
import connectPg from 'connect-pg-simple';
const pgStore = connectPg(session);
const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  tableName: 'sessions',
});
```

#### After (MemoryStore 기반)
```typescript
import createMemoryStore from 'memorystore';
const MemoryStore = createMemoryStore(session);
const sessionStore = new MemoryStore({
  checkPeriod: 86400000, // 24h
});
```

### 3. 인증 토큰 저장

#### Before (PostgreSQL)
```typescript
await storage.createAuthToken({ token, email, expiresAt });
```

#### After (In-Memory)
```typescript
const authTokenStore = new Map<string, AuthToken>();
authTokenStore.set(hashedToken, { token, email, expiresAt, consumed });
```

> **Note**: 프로덕션에서는 Airtable 또는 Redis로 교체 권장

---

## 🗄️ Airtable 테이블 구조

### 마이그레이션 완료된 테이블

| 테이블명 | 상태 | 파일 위치 |
|---------|------|-----------|
| **Users** | ✅ 완료 | `server/airtable/tables/users.ts` |
| **Advertisers** | ✅ 완료 | `server/airtable/tables/advertisers.ts` |
| **Agencies** | ✅ 완료 | `server/airtable/tables/agencies.ts` |
| **Campaigns** | ✅ 완료 | `server/airtable/tables/campaigns.ts` |
| **Ad_Products** | ✅ 완료 | `server/airtable/tables/ad-products.ts` |
| **Quotes** | ✅ 완료 | `server/airtable/tables/quotes.ts` |
| **Quote_Items** | ✅ 완료 | `server/airtable/tables/quote-items.ts` |
| **Invoices** | ✅ 완료 | `server/airtable/tables/invoices.ts` |
| **Tax_Invoices** | ✅ 완료 | `server/airtable/tables/tax-invoices.ts` |
| **Communication_Logs** | ✅ 완료 | `server/airtable/tables/communication-logs.ts` |
| **System_Settings** | ✅ 완료 | `server/airtable/tables/settings.ts` |

### 아직 마이그레이션되지 않은 기능

| 기능 | 현재 상태 | 대응 방안 |
|------|----------|-----------|
| **Memos** | MemStorage 사용 | Airtable 테이블 생성 필요 |
| **Contacts** | MemStorage 사용 | Airtable 테이블 생성 필요 |
| **Ad Slots** | MemStorage 사용 | Ad_Products로 통합 가능 |
| **Ad Materials** | MemStorage 사용 | Campaigns/Creatives로 통합 가능 |

---

## 🚀 배포 가이드

### 환경 변수 설정

#### 필수 설정 (Airtable)
```bash
# Airtable API 설정
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# 세션 보안
SESSION_SECRET=your-super-secret-key-change-in-production

# 애플리케이션 기본 설정
NODE_ENV=production
PORT=5000
```

#### 선택 설정 (Google OAuth)
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
```

### 개발 환경 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값 입력

# 3. 개발 서버 실행
npm run dev

# 서버 접속: http://localhost:5000
```

### 프로덕션 배포

```bash
# 1. 빌드
npm run build

# 2. 프로덕션 실행
npm start
```

---

## 🔍 API 엔드포인트 테스트

### 1. 인증 확인
```bash
curl http://localhost:5000/api/auth/user
# 응답: {"user":null,"devMode":true}
```

### 2. 광고주 목록 조회
```bash
curl http://localhost:5000/api/advertisers
# Airtable 미설정 시: {"error":"Airtable not configured..."}
# Airtable 설정 시: [광고주 목록]
```

### 3. 캠페인 목록 조회
```bash
curl http://localhost:5000/api/campaigns
# Airtable 미설정 시: {"error":"Airtable not configured"}
# Airtable 설정 시: [캠페인 목록]
```

### 4. 시스템 설정 조회
```bash
curl http://localhost:5000/api/settings/general
curl http://localhost:5000/api/settings/notifications
```

---

## 🔄 Fallback 메커니즘

### Airtable 미설정 시 동작

```typescript
// server/airtable/client.ts
export const AIRTABLE_ENABLED = !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);

if (!AIRTABLE_ENABLED) {
  console.warn('⚠️  Airtable credentials not configured.');
  console.warn('   Using in-memory fallback for development.');
}
```

#### 동작 방식
1. **Users**: Google OAuth로 로그인 가능, 데이터 미저장
2. **Advertisers/Campaigns**: 빈 배열 반환
3. **Settings**: 메모리 기반 임시 저장
4. **Sessions**: MemoryStore 사용 (재시작 시 초기화)

---

## ⚠️ 주의사항

### 1. PostgreSQL 관련 코드
- `shared/schema.ts`에 PostgreSQL 스키마가 남아있음 (사용 안 함)
- `server/storage.ts`의 `MemStorage` 클래스가 일부 사용됨
- 향후 완전히 제거하거나 Airtable 전용으로 리팩토링 필요

### 2. Session Storage
- 현재 MemoryStore 사용 (개발 환경 적합)
- 프로덕션에서는 Redis 또는 Airtable 세션 저장소 권장

### 3. Auth Token Storage
- In-Memory Map 사용 (재시작 시 초기화)
- 프로덕션에서는 Airtable 테이블로 이동 권장

### 4. 미완성 기능
- BaroBill 전자세금계산서 발행 기능 (부분 구현)
- Memos/Contacts/Ad Slots Airtable 마이그레이션

---

## 🧪 테스트 체크리스트

### 데이터베이스 연결성
- [ ] Airtable API 연결 성공
- [ ] Fallback 모드 정상 작동
- [ ] 세션 저장/복원 확인

### API 기능
- [ ] 광고주 CRUD 동작
- [ ] 캠페인 CRUD 동작
- [ ] 견적서 CRUD 동작
- [ ] 설정 저장/조회
- [ ] 인증 플로우

### 외부 API 통합
- [ ] Google OAuth 로그인
- [ ] Gmail API 연동
- [ ] Google Calendar 연동
- [ ] Solapi SMS/카카오톡 발송
- [ ] Resend 이메일 발송

---

## 📚 추가 리소스

- [Airtable API 문서](https://airtable.com/developers/web/api/introduction)
- [환경 변수 설정 가이드](.env.example)
- [프로젝트 아키텍처 문서](replit.md)
- [디자인 가이드라인](design_guidelines.md)

---

## 🆘 문제 해결

### 문제: "An API key is required to connect to Airtable"
**해결**: `.env` 파일에 `AIRTABLE_API_KEY`와 `AIRTABLE_BASE_ID` 설정

### 문제: "SESSION_SECRET environment variable is required"
**해결**: `.env` 파일에 `SESSION_SECRET` 추가 (랜덤 문자열)

### 문제: 광고주 목록이 비어있음
**해결**: Airtable Base에 Advertisers 테이블 생성 및 데이터 입력

### 문제: Google OAuth 실패
**해결**: Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성 후 환경 변수 설정

---

**마이그레이션 완료 날짜**: 2025-11-16  
**마지막 업데이트**: 2025-11-16
