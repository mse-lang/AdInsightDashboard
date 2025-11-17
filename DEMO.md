# 🎬 VS-AMS 라이브 데모

## 🌐 접속 URL

**메인 애플리케이션**: https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai

---

## 🧪 API 테스트

### 1. 서버 헬스 체크

```bash
curl https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/api/auth/user
```

**예상 응답**:
```json
{
  "user": null,
  "devMode": true
}
```

### 2. 광고주 목록 조회 (Airtable 미설정)

```bash
curl https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/api/advertisers
```

**예상 응답**:
```json
{
  "error": "Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables."
}
```

### 3. 설정 조회 (In-memory)

```bash
curl https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/api/settings/general
```

**예상 응답**:
```json
{
  "companyName": "벤처스퀘어",
  "ceoName": "",
  "corpNum": "",
  "address": "",
  "phone": "",
  "email": "ad@venturesquare.net"
}
```

### 4. 대시보드 메트릭

```bash
curl https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/api/dashboard/metrics
```

**예상 응답**:
```json
{
  "success": true,
  "metrics": {
    "newInquiries": 0,
    "activeDeals": 0,
    "totalRevenue": 0,
    "pendingInvoices": 0
  }
}
```

---

## 📊 API 엔드포인트 목록

### ✅ 작동하는 엔드포인트 (Airtable 없이)

| 엔드포인트 | 메서드 | 상태 | 설명 |
|-----------|--------|------|------|
| `/api/auth/user` | GET | ✅ 200 | 현재 사용자 (개발 모드) |
| `/api/settings/general` | GET | ✅ 200 | 일반 설정 (In-memory) |
| `/api/settings/notifications` | GET | ✅ 200 | 알림 설정 (In-memory) |
| `/api/dashboard/metrics` | GET | ✅ 200 | 대시보드 메트릭 |
| `/api/users` | GET | ✅ 200 | 사용자 목록 (빈 배열) |
| `/api/tax-invoices` | GET | ✅ 200 | 세금계산서 (빈 배열) |

### 🟡 Airtable 필요 엔드포인트

| 엔드포인트 | 메서드 | 상태 | 설명 |
|-----------|--------|------|------|
| `/api/advertisers` | GET | 🟡 503 | 광고주 목록 (Airtable 필요) |
| `/api/agencies` | GET | 🟡 503 | 에이전시 목록 |
| `/api/campaigns` | GET | 🟡 503 | 캠페인 목록 |
| `/api/quotes` | GET | 🟡 503 | 견적서 목록 |
| `/api/ad-products` | GET | 🟡 503 | 광고 상품 목록 |
| `/api/invoices` | GET | 🟡 503 | 인보이스 목록 |

---

## 🎯 데모 시나리오

### 시나리오 1: 개발 모드 확인

1. **서버 접속**
   ```
   https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai
   ```

2. **로그인 페이지 확인**
   - 개발 모드가 활성화되어 있으면 자동 로그인 버튼 표시
   - Google OAuth 버튼 표시 (설정 필요)

3. **API 응답 확인**
   ```bash
   curl https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/api/auth/user
   ```

### 시나리오 2: Airtable 연동 확인

1. **Airtable 미설정 상태**
   ```bash
   curl https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/api/advertisers
   ```
   → 503 에러 및 설정 안내 메시지

2. **In-memory Fallback 작동**
   ```bash
   curl https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/api/settings/general
   ```
   → 200 OK 및 기본 설정 반환

### 시나리오 3: API 일괄 테스트

1. **로컬에서 테스트 스크립트 실행**
   ```bash
   PORT=5000 npm run test:api
   ```

2. **13개 엔드포인트 자동 테스트**
   - 6개 엔드포인트: 200 OK
   - 7개 엔드포인트: 503 (Airtable 필요)

---

## 🖥️ 프론트엔드 데모

### 접속 가능한 페이지

1. **로그인 페이지**
   ```
   https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/
   ```

2. **대시보드** (로그인 후)
   ```
   https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/
   ```

3. **광고주 관리**
   ```
   https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/advertisers
   ```
   → Airtable 미설정 시 에러 메시지 표시

4. **캠페인 관리**
   ```
   https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/campaigns
   ```

5. **설정 페이지**
   ```
   https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai/settings
   ```
   → In-memory 설정 저장/조회 가능

---

## 🔍 현재 상태

### ✅ 정상 작동

- ✅ 서버 실행 중 (포트 5000)
- ✅ API 엔드포인트 응답
- ✅ 개발 모드 활성화
- ✅ In-memory Fallback 작동
- ✅ 에러 핸들링 정상
- ✅ 설정 저장/조회 가능

### ⚠️ 제한 사항 (개발 모드)

- ⚠️ Airtable 미설정 (광고주, 캠페인 등 503 에러)
- ⚠️ Google OAuth 미설정 (자동 로그인만 가능)
- ⚠️ 세션 데이터 메모리 저장 (재시작 시 초기화)
- ⚠️ 데이터 영속성 없음 (In-memory 저장소)

### 🎯 프로덕션 준비 상태

**다음 단계만 완료하면 프로덕션 사용 가능**:
1. Airtable API Key 및 Base ID 설정
2. Google OAuth 클라이언트 ID/Secret 설정
3. SESSION_SECRET 설정 (프로덕션용)

---

## 📱 모바일/데스크톱 테스트

### 데스크톱 브라우저
```
Chrome/Firefox/Safari에서 접속:
https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai
```

### 모바일 브라우저
```
모바일에서 동일 URL 접속:
https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai
```
→ 반응형 디자인 (Tailwind CSS)

### API 테스트 (Postman/Insomnia)
```
Base URL: https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai
Header: Content-Type: application/json
```

---

## 🧪 테스트 명령어 모음

### cURL 테스트

```bash
# 기본 URL
BASE_URL="https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai"

# 1. 헬스 체크
curl $BASE_URL/api/auth/user

# 2. 광고주 목록
curl $BASE_URL/api/advertisers

# 3. 캠페인 목록
curl $BASE_URL/api/campaigns

# 4. 설정 조회
curl $BASE_URL/api/settings/general

# 5. 대시보드 메트릭
curl $BASE_URL/api/dashboard/metrics

# 6. 사용자 목록
curl $BASE_URL/api/users

# 7. 세금계산서 목록
curl $BASE_URL/api/tax-invoices
```

### JavaScript Fetch

```javascript
// 브라우저 콘솔에서 실행
const baseUrl = 'https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai';

// 현재 사용자 정보
fetch(`${baseUrl}/api/auth/user`)
  .then(res => res.json())
  .then(data => console.log('User:', data));

// 광고주 목록
fetch(`${baseUrl}/api/advertisers`)
  .then(res => res.json())
  .then(data => console.log('Advertisers:', data));

// 설정 조회
fetch(`${baseUrl}/api/settings/general`)
  .then(res => res.json())
  .then(data => console.log('Settings:', data));
```

### Python Requests

```python
import requests

base_url = "https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai"

# 헬스 체크
response = requests.get(f"{base_url}/api/auth/user")
print("User:", response.json())

# 광고주 목록
response = requests.get(f"{base_url}/api/advertisers")
print("Advertisers:", response.json())

# 설정 조회
response = requests.get(f"{base_url}/api/settings/general")
print("Settings:", response.json())
```

---

## 📊 실시간 로그 모니터링

서버에서 실시간 로그를 확인하려면:

```bash
# API 요청 로그
tail -f logs/api.log

# 에러 로그
tail -f logs/error.log
```

**현재 서버 로그** (마지막 요청):
```
4:36:12 PM [express] GET /api/auth/user 200 in 1ms
4:36:12 PM [express] GET /api/advertisers 503 in 1ms
4:36:12 PM [express] GET /api/settings/general 200 in 1ms
```

---

## 🎉 데모 완료 체크리스트

- [x] 서버 실행 중 ✅
- [x] 공개 URL 접근 가능 ✅
- [x] API 엔드포인트 응답 ✅
- [x] 개발 모드 작동 ✅
- [x] In-memory Fallback 작동 ✅
- [x] 에러 메시지 적절 ✅
- [ ] Airtable 연동 (프로덕션 설정 필요)
- [ ] Google OAuth (프로덕션 설정 필요)

---

## 📞 문의

**서버 상태**: 🟢 온라인  
**마지막 업데이트**: 2025-11-16  
**서버 가동 시간**: 실시간 모니터링 중

테스트 중 문제가 발생하면 GitHub Issues로 문의해주세요!

---

**🔗 빠른 링크**:
- [메인 애플리케이션](https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai)
- [API 문서](./README.md#-api-문서)
- [배포 가이드](./DEPLOYMENT_CHECKLIST.md)
