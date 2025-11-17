# 캘린더 로그인 문제 해결

## 문제 상황

**사용자 보고**: 
- VS-AMS에 Google로 로그인했는데도 캘린더 페이지에서 다시 로그인을 요구함
- 이미 인증된 상태인데 왜 캘린더만 로그인을 요구하는지 의문

## 원인 분석

### iframe의 격리된 컨텍스트

Google Calendar를 iframe으로 임베드할 때 발생하는 문제:

1. **별도의 브라우저 컨텍스트**: iframe은 부모 페이지와 별도의 보안 컨텍스트를 가짐
2. **쿠키 공유 제한**: Same-Origin Policy로 인해 쿠키가 공유되지 않음
3. **비공개 캘린더**: `mj@venturesquare.net` 캘린더가 비공개인 경우 iframe 내에서 재인증 필요

### 인증 흐름

```
사용자 로그인 (VS-AMS) ✅
  ↓
Google OAuth 완료 ✅
  ↓
메인 앱에서 인증됨 ✅
  ↓
캘린더 페이지 접속 ✅
  ↓
iframe이 Google Calendar 로드 시도
  ↓
iframe 컨텍스트에서 쿠키 확인 ❌
  ↓
Google Calendar에서 로그인 요구 ❌
```

## 해결 방법

### 개선된 UI/UX

사용자가 쉽게 캘린더에 접근할 수 있도록 다음 기능 추가:

#### 1. 상단 안내 Alert
```typescript
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>캘린더 보기</AlertTitle>
  <AlertDescription>
    Google Calendar가 iframe에서 로그인을 요구하는 경우, 
    아래 버튼을 클릭하여 새 탭에서 캘린더를 열어주세요.
    <Button onClick={handleOpenInNewTab}>
      <ExternalLink /> 새 탭에서 열기
    </Button>
  </AlertDescription>
</Alert>
```

**효과**: 
- 사용자에게 명확한 안내 제공
- 즉시 해결 방법 제시
- 원클릭으로 새 탭에서 열기

#### 2. 카드 헤더 버튼
```typescript
<CardHeader className="flex flex-row items-center justify-between">
  <CardTitle>월별 광고 일정</CardTitle>
  <Button onClick={handleOpenInNewTab}>
    <ExternalLink /> Google Calendar에서 열기
  </Button>
</CardHeader>
```

**효과**:
- 캘린더 카드에서 바로 접근 가능
- 시각적으로 명확한 액션 버튼

#### 3. 하단 전체 화면 버튼
```typescript
<Button onClick={handleOpenInNewTab} className="w-full">
  <CalendarIcon /> Google Calendar에서 전체 화면으로 보기
</Button>
```

**효과**:
- 전체 화면으로 캘린더 사용 가능
- 더 나은 사용자 경험

### 새 탭 열기 로직

```typescript
const calendarUrl = `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(calendarId)}`;

const handleOpenInNewTab = () => {
  window.open(calendarUrl, '_blank', 'noopener,noreferrer');
};
```

**작동 원리**:
1. 사용자가 버튼 클릭
2. 새 탭에서 Google Calendar 열기
3. 브라우저의 기존 Google 세션 사용
4. **자동으로 로그인됨** (재인증 불필요)

## 사용자 경험 개선

### Before (문제 상황)
```
1. 캘린더 페이지 접속
2. iframe에 로그인 화면 표시
3. 사용자 혼란 😕
4. 다시 로그인 필요 😞
```

### After (개선 후)
```
1. 캘린더 페이지 접속
2. 명확한 안내 메시지 표시 ℹ️
3. "새 탭에서 열기" 버튼 클릭 🖱️
4. 새 탭에서 자동 로그인 ✅
5. 캘린더 즉시 사용 가능 😊
```

## 기술 상세

### URL 파라미터

```typescript
// 직접 접근 URL (새 탭)
https://calendar.google.com/calendar/u/0?cid=mj@venturesquare.net

// 임베드 URL (iframe)
https://calendar.google.com/calendar/embed?src=mj@venturesquare.net&mode=MONTH&...
```

**차이점**:
- `u/0`: 현재 Google 계정(첫 번째 계정) 사용
- `cid`: Calendar ID 파라미터
- 임베드 URL은 많은 커스터마이징 옵션 포함

### 보안 고려사항

```typescript
window.open(calendarUrl, '_blank', 'noopener,noreferrer');
```

- **noopener**: 새 탭이 `window.opener` 접근 불가 (보안)
- **noreferrer**: Referer 헤더 전송 안 함 (프라이버시)

## 추가 개선 사항

### 1. 사용자 가이드 추가

```
💡 Tip: iframe에서 로그인이 요구되는 경우, 
"새 탭에서 열기" 버튼을 사용하면 현재 Google 계정으로 자동 로그인됩니다.
```

### 2. 다양한 접근 방법 제공

- 상단 Alert의 버튼
- 카드 헤더의 버튼
- 하단 전체 화면 버튼

**이점**: 사용자가 어디서든 쉽게 접근 가능

### 3. 시각적 피드백

- `ExternalLink` 아이콘으로 새 탭에서 열림을 명확히 표시
- `AlertCircle` 아이콘으로 중요 정보임을 강조

## 대안 솔루션 (구현하지 않음)

### 1. 캘린더를 공개로 설정
❌ **권장하지 않음**
- 보안 문제: 누구나 캘린더 볼 수 있음
- 민감한 광고 일정 노출 위험

### 2. Google Calendar API 사용
⚠️ **복잡함**
- API 인증 필요
- 추가 개발 시간 소요
- 캘린더 UI를 직접 구현해야 함

### 3. OAuth 토큰 전달
⚠️ **보안 위험**
- iframe에 토큰 노출
- CORS 제약
- 추가 보안 위험

## 테스트 시나리오

### 시나리오 1: 정상 케이스
1. VS-AMS에 Google로 로그인
2. 캘린더 메뉴 클릭
3. 상단 Alert 확인
4. "새 탭에서 열기" 버튼 클릭
5. ✅ 새 탭에서 캘린더 자동 열림
6. ✅ 재로그인 없이 캘린더 사용 가능

### 시나리오 2: iframe 로그인 요구
1. 캘린더 페이지 접속
2. iframe에서 로그인 화면 표시
3. Alert 메시지 읽기
4. "새 탭에서 열기" 버튼 클릭
5. ✅ 새 탭에서 자동 로그인됨

### 시나리오 3: 전체 화면 보기
1. 캘린더 페이지 하단 스크롤
2. "Google Calendar에서 전체 화면으로 보기" 버튼 클릭
3. ✅ 새 탭에서 전체 화면 캘린더 열림
4. ✅ 더 나은 사용자 경험

## 파일 변경

### client/src/pages/calendar.tsx

**추가된 컴포넌트**:
- `Alert`, `AlertDescription`, `AlertTitle`
- `Button`
- `ExternalLink`, `AlertCircle` 아이콘

**추가된 기능**:
- `handleOpenInNewTab()` 함수
- 새 탭에서 열기 버튼 3곳
- 사용자 가이드 메시지

**변경 사항**:
- iframe은 그대로 유지 (기본 보기)
- 새 탭 열기 옵션 추가 (권장 방법)

## 결과

### ✅ 해결된 문제

1. **로그인 혼란 제거**
   - 명확한 안내 메시지
   - 즉시 사용 가능한 해결 버튼

2. **더 나은 UX**
   - 3곳에서 새 탭 열기 가능
   - 자동 로그인으로 원활한 경험

3. **보안 유지**
   - 캘린더 비공개 상태 유지
   - 안전한 인증 흐름

### 🎯 사용자 만족도 향상

| Before | After |
|--------|-------|
| 혼란스러운 로그인 요구 | 명확한 안내와 해결책 |
| iframe 내 재로그인 | 새 탭에서 자동 로그인 |
| 제한된 화면 크기 | 전체 화면 옵션 제공 |

## 관련 문서

- [Google Calendar Integration](GOOGLE_CALENDAR_INTEGRATION.md)
- [Campaign Fix Summary](CAMPAIGN_FIX_SUMMARY.md)

---

**날짜**: 2024-11-16  
**상태**: ✅ 완료  
**PR**: https://github.com/mse-lang/AdInsightDashboard/pull/1
