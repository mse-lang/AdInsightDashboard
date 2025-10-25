# 벤처스퀘어 광고 관리 대시보드 디자인 가이드라인

## Design Approach

**선택한 접근방식**: Design System Approach (Material Design + Korean SaaS Best Practices)

**참조 시스템**: Material Design with inspiration from Linear, Notion, and Korean business tools (Naver Analytics, Kakao Business)

**핵심 디자인 원칙**:
- 명확성 우선: 복잡한 데이터를 직관적으로 표현
- 효율적 워크플로우: 빠른 작업 처리를 위한 구조
- 정보 밀도 관리: 많은 데이터를 압도하지 않게 구성
- 한국어 최적화: 한글 가독성과 업무 용어 고려

---

## Typography

### Font Families
- **Primary**: 'Pretendard', -apple-system, 'Noto Sans KR', sans-serif
- **Monospace (데이터/숫자)**: 'JetBrains Mono', 'D2Coding', monospace

### Font Scale
- **Heading 1 (대시보드 타이틀)**: 2rem (32px), font-weight: 700
- **Heading 2 (섹션 제목)**: 1.5rem (24px), font-weight: 600
- **Heading 3 (카드/모달 제목)**: 1.25rem (20px), font-weight: 600
- **Body Large (강조 텍스트)**: 1.125rem (18px), font-weight: 500
- **Body (기본 텍스트)**: 1rem (16px), font-weight: 400
- **Body Small (보조 정보)**: 0.875rem (14px), font-weight: 400
- **Caption (메타 정보)**: 0.75rem (12px), font-weight: 400

### Line Heights
- Headings: 1.3
- Body text: 1.6
- Dense data (tables): 1.4

---

## Layout System

### Spacing Primitives (Tailwind)
**핵심 간격 세트**: 2, 4, 6, 8, 12, 16 units
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card margins: m-4, m-6
- Grid gaps: gap-4, gap-6

### Grid Structure
- **컨테이너**: max-w-[1600px] mx-auto px-6
- **사이드바 레이아웃**: 고정 사이드바 (w-64) + 메인 콘텐츠 영역
- **대시보드 그리드**: grid grid-cols-12 gap-6
  - 주요 지표 카드: col-span-12 lg:col-span-6 xl:col-span-3
  - 차트/테이블: col-span-12 lg:col-span-8
  - 사이드 정보: col-span-12 lg:col-span-4

### Responsive Breakpoints
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: 1024px+ (3-4 columns)

---

## Component Library

### Navigation
**사이드바 네비게이션** (고정, 접을 수 있는 구조):
- Width: w-64 (확장), w-16 (축소)
- 메뉴 항목: px-4 py-3, hover 상태 배경 전환
- 아이콘 + 텍스트 조합
- 활성 항목: border-l-4 + 강조 표시

**상단 헤더**:
- Height: h-16
- 구성: 로고 + 검색 + 알림 + 프로필
- 고정 위치 (sticky top-0)

### Cards
**기본 카드 구조**:
- Border radius: rounded-lg (8px)
- Padding: p-6
- Shadow: subtle elevation
- Header: flex justify-between items-center mb-4

**카드 유형**:
- **Stat Card (지표 카드)**: 아이콘 + 제목 + 큰 숫자 + 변화율 표시
- **Data Card (데이터 카드)**: 제목 + 테이블/리스트
- **Chart Card**: 제목 + 드롭다운 필터 + 차트 영역
- **Alert Card**: 아이콘 + 메시지 + 액션 버튼

### Forms
**Input Fields**:
- Height: h-10 (기본), h-12 (large)
- Padding: px-4 py-2
- Border radius: rounded-md
- Label: mb-2, font-weight: 500

**Form Layout**:
- 단일 컬럼 (모바일)
- 2-3 컬럼 그리드 (데스크톱): grid grid-cols-1 md:grid-cols-2 gap-4

**Button Styles**:
- Primary: px-6 py-2.5, rounded-md, font-weight: 600
- Secondary: bordered variant
- Icon buttons: square (w-10 h-10), rounded-md

### Tables
**데이터 테이블 구조**:
- Header: sticky top, font-weight: 600, border-b
- Rows: hover 상태, border-b, 교차 행 배경
- Cell padding: px-4 py-3
- 모바일: 카드 형태로 변환

**테이블 기능**:
- 정렬 가능 헤더 (아이콘 표시)
- 페이지네이션 (하단)
- 행 선택 체크박스 (왼쪽)
- 액션 버튼 (오른쪽)

### Status Badges
**진행 상태 배지**:
- Padding: px-3 py-1
- Border radius: rounded-full
- Font size: text-sm
- 상태별 구분: 문의중, 견적제시, 일정조율중, 부킹확정, 집행중, 결과보고, 세금계산서 발행 및 대금 청구, 매출 입금

### Modals
**모달 구조**:
- Backdrop: semi-transparent overlay
- Container: max-w-2xl, rounded-lg, p-6
- Header: flex justify-between + 닫기 버튼
- Footer: flex justify-end + 액션 버튼들

### Notifications/Alerts
**알림 배너** (대시보드 상단):
- Width: full-width
- Padding: px-6 py-4
- 아이콘 + 메시지 + 닫기 버튼
- 슬라이드 인/아웃 애니메이션

### Data Visualization
**차트 컴포넌트** (Chart.js/Recharts 사용):
- Line charts: 월별 매출 추이
- Bar charts: 구좌별 판매 현황
- Donut charts: 진행 상태 분포
- Height: h-64 ~ h-80
- 반응형 크기 조정

**타임라인 뷰**:
- 수평 스크롤 가능
- 날짜 기반 그리드
- 광고 블록: 드래그 가능, 클릭 시 상세 정보

---

## Key Page Layouts

### 1. 대시보드 (메인)
**레이아웃**:
- 3-4 컬럼 Stat Cards (신규 문의, 집행중 광고, 월 매출, 진행 건수)
- 진행 상황 타임라인 (Kanban-style view with 8 stages)
- 라이브/예약 광고 스케줄 (Calendar/Timeline view)
- 최근 활동 로그

### 2. 광고주 관리
**레이아웃**:
- 필터바 (상태, 검색)
- 광고주 테이블 (이름, 연락처, 상태, 금액, 날짜, 액션)
- 개별 광고주 상세 뷰 (슬라이드 패널 또는 모달):
  - 기본 정보 섹션
  - 문의 내역
  - 견적서 리스트
  - 광고 소재 목록
  - 집행 내역
  - 성과 데이터

### 3. 광고 구좌 관리
**레이아웃**:
- 탭 네비게이션 (메인배너, 사이드배너1, 사이드배너2, 사이드배너3, 뉴스레터, eDM)
- 각 구좌별:
  - 현재 배치 상태 (시각적 프리뷰)
  - 롤링 슬롯 관리 (드래그 앤 드롭)
  - 소재 업로드 섹션
  - 가격 설정

### 4. 견적/청구 관리
**레이아웃**:
- 견적서 리스트 (테이블)
- 견적서 생성 폼 (모달):
  - 광고주 선택
  - 구좌 선택 (다중)
  - 자동 총액 계산 표시
  - PDF 다운로드 버튼

### 5. 성과 분석
**레이아ウ�**:
- 날짜 범위 선택기
- 차트 그리드:
  - 월별 매출 추이
  - 구좌별 판매 현황
  - 성과 지표 (노출수, 클릭수, CTR)
- 스티비 연동 데이터 섹션
- 구글 애널리틱스 입력 폼

### 6. 광고주 문의 폼 (Public)
**레이아웃** (단일 페이지):
- 심플한 헤더 (로고)
- 중앙 정렬 폼 카드 (max-w-2xl)
- 입력 필드: 문의 내용, 소재, 기간, 예산, 담당자 이름, 휴대폰번호, 이메일주소
- 제출 버튼
- 성공 메시지 오버레이

---

## Images

**이미지 사용 권장사항**:
- **로고**: 사이드바 상단 및 공개 문의 폼 헤더
- **빈 상태 일러스트**: 데이터가 없을 때 (예: 새 문의 없음, 광고 없음)
- **광고 소재 썸네일**: 광고 관리 화면에서 미리보기
- **아이콘**: Heroicons 사용 (outline style for navigation, solid for actions)

**Hero Image**: 이 프로젝트는 대시보드/관리 도구이므로 Hero Section 불필요

---

## Animations

**최소한의 애니메이션**:
- 모달 오픈/클로즈: fade + scale (duration-200)
- 알림 표시: slide-in-down (duration-300)
- 호버 상태: subtle scale/brightness 변화 (duration-150)
- 테이블 행 호버: 배경 전환 (duration-100)

**애니메이션 원칙**: 성능과 접근성을 해치지 않는 범위에서 미묘하게 적용

---

## Accessibility

- Form labels: 명확하고 일관된 라벨링
- Focus states: 모든 인터랙티브 요소에 명확한 focus ring
- Color contrast: WCAG AA 기준 충족
- Keyboard navigation: Tab 순서 논리적 구성
- ARIA labels: 아이콘 버튼, 상태 표시기에 적용

---

이 가이드라인은 복잡한 광고 관리 워크플로우를 효율적으로 처리하면서도, 한국어 비즈니스 환경에 최적화된 직관적인 인터페이스를 제공합니다.