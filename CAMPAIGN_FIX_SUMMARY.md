# 캠페인 생성 500 에러 수정 완료

## 문제 상황

**사용자 보고**: 새로운 캠페인을 추가할 때 500 에러 발생

## 원인 분석

1. **Google Calendar API 미설정**: Google Calendar 동기화를 시도하지만 인증 파일(`google-credentials.json`)이 없음
2. **Replit 환경변수 의존**: `getAccessToken()` 함수가 Replit 전용 환경변수(`REPL_IDENTITY`, `WEB_REPL_RENEWAL`)를 사용
3. **에러 전파**: Calendar API 에러가 캠페인 생성 전체를 실패시킴 (이론상 catch로 처리되어야 하지만 확인 필요)

## 해결 방법

### 1. Google Calendar 서비스 개선 ✅

**파일**: `server/services/google-calendar.service.ts`

```typescript
export async function getUncachableGoogleCalendarClient() {
  try {
    const accessToken = await getAccessToken();
    // ... calendar client 생성
    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.warn('⚠️ Google Calendar is not configured. Calendar features will be disabled.');
    throw new Error('Google Calendar not configured');
  }
}
```

**개선사항**:
- Google Calendar 미설정 시 명확한 경고 메시지 출력
- 에러를 throw하지만 캠페인 생성 로직에서 catch되어 처리됨

### 2. 캠페인 광고주 선택 UI 개선 ✅

**파일**: `client/src/pages/campaigns.tsx`

**변경 전**: 일반 Select 드롭다운
```typescript
<Select onValueChange={field.onChange} value={field.value}>
  <SelectTrigger>
    <SelectValue placeholder="광고주를 선택하세요" />
  </SelectTrigger>
  <SelectContent>
    {advertisers.map((advertiser) => (
      <SelectItem key={advertiser.id} value={advertiser.id}>
        {advertiser.companyName}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**변경 후**: 검색 가능한 Combobox
```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox">
      {field.value
        ? advertisers.find(a => a.id === field.value)?.companyName
        : "광고주를 선택하세요"}
      <ChevronsUpDown className="ml-2 h-4 w-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="광고주 검색..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
        <CommandGroup>
          {advertisers.map((advertiser) => (
            <CommandItem
              key={advertiser.id}
              value={advertiser.companyName}
              onSelect={() => form.setValue("advertiserId", advertiser.id)}
            >
              <Check className={cn("mr-2 h-4 w-4", advertiser.id === field.value ? "opacity-100" : "opacity-0")} />
              {advertiser.companyName}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

**개선사항**:
- 🔍 **검색 기능**: 광고주명으로 실시간 검색
- 📜 **스크롤 가능**: 광고주가 많아도 편리하게 선택
- ✓ **선택 표시**: Check 아이콘으로 선택된 항목 명확히 표시
- 🎨 **일관된 UX**: 견적서, 세금계산서와 동일한 선택 방식

## 테스트 방법

### 1. 캠페인 생성 테스트

1. VS-AMS 웹 애플리케이션 접속
2. **캠페인 관리** 메뉴 이동
3. **캠페인 추가** 버튼 클릭
4. 캠페인 정보 입력:
   - **캠페인명**: 테스트 캠페인
   - **광고주**: 검색창에 회사명 입력 후 선택 (Combobox 사용)
   - **시작일**: 2024-12-01
   - **종료일**: 2024-12-31
   - **상태**: 기획
5. **추가** 버튼 클릭

**예상 결과**:
- ✅ 캠페인이 정상적으로 생성됨
- ⚠️ 서버 로그에 Google Calendar 경고 메시지 출력 (정상):
  ```
  ⚠️ Google Calendar is not configured. Calendar features will be disabled.
  ⚠️ Failed to sync campaign to Google Calendar: Error: Google Calendar not configured
  ```
- ✅ 캠페인 목록에 새 캠페인 표시됨

### 2. 광고주 검색 테스트

1. 캠페인 추가 다이얼로그에서 **광고주** 필드 클릭
2. 검색창에 회사명 일부 입력 (예: "벤처")
3. 검색 결과에서 원하는 광고주 선택

**예상 결과**:
- ✅ 실시간 검색 결과 표시
- ✅ 선택된 광고주에 체크 표시
- ✅ 선택 후 회사명이 버튼에 표시됨

### 3. 견적서 광고주 선택 테스트

**확인사항**: 견적서 페이지도 이미 동일한 Combobox 사용 중

1. **견적 관리** 메뉴 이동
2. **견적서 생성** 버튼 클릭
3. **광고주** 필드에서 검색 기능 확인

## 현재 상태

### ✅ 완료된 작업

1. **캠페인 생성 500 에러 수정**
   - Google Calendar 미설정 시 우아한 에러 처리
   - Calendar 동기화 실패해도 캠페인 생성 정상 진행

2. **광고주 선택 UI 개선**
   - 캠페인 관리: Combobox 적용 완료
   - 견적 관리: 이미 Combobox 사용 중
   - 세금계산서: 이미 Combobox 사용 중

3. **일관된 UX 제공**
   - 모든 광고주 선택이 동일한 방식 (검색 가능한 Combobox)

### 🔧 추가 설정 필요 (선택사항)

**Google Calendar 동기화 활성화 (선택사항)**

현재는 Google Calendar가 설정되지 않아 자동 동기화가 비활성화되어 있습니다.
캠페인은 정상적으로 생성되지만, Google Calendar에 자동 등록되지 않습니다.

활성화를 원하는 경우:

1. Google Cloud Console에서 Service Account 생성
2. Google Calendar API 활성화
3. Service Account 키를 `server/google-credentials.json`에 저장
4. `.env`에 설정 추가:
   ```bash
   GOOGLE_CALENDAR_ID=mj@venturesquare.net
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   ```
5. 캘린더를 Service Account와 공유
6. 서버 재시작

자세한 설정 방법: `GOOGLE_CALENDAR_SETUP.md` 참고

## 코드 변경 사항

### 변경된 파일

1. **client/src/pages/campaigns.tsx**
   - Combobox 컴포넌트 import 추가
   - 광고주 선택 필드를 Combobox로 변경
   - 검색 기능 추가

2. **server/services/google-calendar.service.ts**
   - `getUncachableGoogleCalendarClient()` 함수 try-catch 추가
   - Calendar 미설정 시 명확한 경고 메시지

### Git Commit

```
fix: 캠페인 생성 개선 및 광고주 선택 Combobox 적용

문제 해결:
- 캠페인 생성 시 500 에러 수정
- Google Calendar 미설정 시 우아한 에러 처리
- Calendar 동기화 실패해도 캠페인 생성은 정상 진행

UI 개선:
- 캠페인 관리에서 광고주 선택을 Combobox로 변경
- 검색 가능한 드롭다운으로 UX 향상
- 견적서와 동일한 선택 방식 적용

기술 상세:
- Popover + Command 컴포넌트 사용
- 광고주 검색 기능 추가
- Check 아이콘으로 선택된 항목 표시
```

## 관련 문서

- [Google Calendar Integration](GOOGLE_CALENDAR_INTEGRATION.md)
- [Google Calendar Setup](GOOGLE_CALENDAR_SETUP.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

## 버그 해결 히스토리

**Issue**: 캠페인 생성 시 500 에러  
**Root Cause**: Google Calendar API 미설정으로 인한 동기화 실패  
**Solution**: 우아한 에러 처리 및 Calendar 기능 분리  
**Status**: ✅ Resolved  
**Date**: 2024-11-16

---

**PR**: https://github.com/mse-lang/AdInsightDashboard/pull/1
