# 견적서 생성 기능 개선 가이드

## ✅ 적용된 개선사항

### 1. 광고주 선택 - 검색 및 스크롤 기능

**기존 문제**:
- 기본 Select 드롭다운으로 광고주 목록이 많을 경우 찾기 어려움
- 검색 기능 없음

**개선 사항**:
- ✅ **검색 가능한 Combobox** 컴포넌트로 변경
- ✅ 실시간 검색 기능 (회사명으로 필터링)
- ✅ 스크롤 가능한 리스트
- ✅ 키보드 네비게이션 지원 (↑↓ 키로 이동, Enter로 선택)
- ✅ 선택된 광고주 표시

**사용 방법**:
1. "광고주" 필드 클릭
2. 검색창에 회사명 입력 (예: "테크")
3. 실시간으로 필터링된 결과 확인
4. 원하는 광고주 클릭하여 선택

**기술 스택**:
- `Popover` + `Command` 컴포넌트 (Shadcn/ui)
- 실시간 필터링 로직
- 상태 관리: `advertiserSearchOpen`, `advertiserSearch`

---

### 2. 광고 상품 선택 - 설정의 단가표 연동

**기존 문제**:
- `/api/ad-products` 사용 (별도 관리)
- 설정 페이지의 단가표와 분리되어 데이터 불일치 가능

**개선 사항**:
- ✅ **설정의 단가표(Pricings)** 직접 사용
- ✅ 가격, 규격, 설명 모두 표시
- ✅ 최대 높이 300px로 제한하여 스크롤 가능
- ✅ 단가표 업데이트 시 견적서에 즉시 반영

**표시 정보**:
```
[상품명] - [가격]
규격: [specs]
설명: [description]
```

**예시**:
```
네이버 배너 광고 - ₩2,400,000
규격: PC: 1900×400px, Mobile: 600×300px
설명: 매달 240만원
```

**사용 방법**:
1. "광고 상품" 드롭다운 클릭
2. 스크롤하여 원하는 상품 찾기
3. 상품 선택 시 가격 자동 입력
4. 수량 입력 후 "품목 추가" 클릭

---

## 🔧 기술적 세부사항

### 프론트엔드 변경사항

#### 1. 새로운 Import
```typescript
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
```

#### 2. 광고주 Combobox 구현
```typescript
<Popover open={advertiserSearchOpen} onOpenChange={setAdvertiserSearchOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox">
      {advertiserId ? getSelectedAdvertiser()?.companyName : "광고주를 검색하거나 선택하세요"}
      <ChevronsUpDown className="ml-2 h-4 w-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="광고주 검색..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
        <CommandGroup>
          {filteredAdvertisers.map((advertiser) => (
            <CommandItem key={advertiser.id} onSelect={() => setAdvertiserId(advertiser.id)}>
              <Check className={advertiserId === advertiser.id ? "opacity-100" : "opacity-0"} />
              {advertiser.companyName}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

#### 3. 단가표 연동
```typescript
// 기존: adProducts 사용
const { data: adProducts = [] } = useQuery<AirtableAdProduct[]>({
  queryKey: ["/api/ad-products"],
});

// 개선: pricings 사용
const { data: pricings = [] } = useQuery<Pricing[]>({
  queryKey: ["/api/pricings"],
});
```

#### 4. 품목 추가 로직 변경
```typescript
// 기존
const product = adProducts.find(p => p.id === selectedProductId);
const newItem = {
  adProductId: product.id,
  unitPrice: product.unitPrice,
  ...
};

// 개선
const pricing = pricings.find(p => p.id === selectedProductId);
const unitPrice = parseInt(pricing.price.replace(/[^0-9]/g, '')) || 0;
const newItem = {
  pricingId: pricing.id,
  unitPrice,
  ...
};
```

### 백엔드 변경사항

#### API 하위 호환성 유지
`/api/quote-items/bulk` 엔드포인트가 `pricingId`와 `adProductId` 모두 받도록 수정:

```typescript
// routes.ts - 스키마 검증
const schema = z.object({
  quoteId: z.string().trim().min(1),
  items: z.array(z.object({
    pricingId: z.string().trim().min(1).optional(),
    adProductId: z.string().trim().min(1).optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0),
    // ...
  }).refine(data => data.pricingId || data.adProductId, {
    message: "Either pricingId or adProductId is required"
  })),
});

// 매핑 로직
const itemsWithQuoteId = data.items.map(item => ({
  quoteId: data.quoteId,
  adProductId: item.pricingId || item.adProductId!, // pricingId 우선 사용
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  // ...
}));
```

**하위 호환성**:
- ✅ 기존 코드에서 `adProductId` 사용 가능
- ✅ 새 코드에서 `pricingId` 사용 권장
- ✅ Airtable 스키마 변경 불필요

---

## 🧪 테스트 가이드

### 1. 광고주 검색 테스트

**시나리오 1: 검색 기능**
1. 견적서 생성 다이얼로그 열기
2. "광고주" 필드 클릭
3. 검색창에 "테크" 입력
4. 결과에 "테크"가 포함된 광고주만 표시되는지 확인

**시나리오 2: 스크롤**
1. 광고주 목록 열기
2. 광고주가 많을 경우 스크롤바 표시 확인
3. 스크롤하여 원하는 광고주 찾기

**시나리오 3: 키보드 네비게이션**
1. 광고주 목록 열기
2. ↑↓ 화살표 키로 이동
3. Enter 키로 선택
4. Esc 키로 닫기

### 2. 단가표 연동 테스트

**사전 준비**:
1. 설정 → 단가 관리에서 상품 추가
   - 상품명: "테스트 배너"
   - 단가: 3000000
   - 규격: "1920x1080"
   - 설명: "테스트용"

**테스트 단계**:
1. 견적서 생성 다이얼로그 열기
2. "광고 상품" 드롭다운 클릭
3. "테스트 배너" 선택
4. 단가가 ₩3,000,000으로 자동 입력되는지 확인
5. 규격과 설명이 표시되는지 확인

### 3. 품목 추가 테스트

**시나리오**:
1. 광고주 선택: "테스트 회사"
2. 광고 상품 선택: "네이버 배너"
3. 수량: 3
4. "품목 추가" 클릭
5. 품목 목록에 추가되는지 확인
6. 소계가 정확한지 확인 (단가 × 수량)

### 4. 견적서 생성 완료 테스트

**전체 플로우**:
1. 광고주 선택 (검색 사용)
2. 2개 이상의 품목 추가
3. 할인율 10% 입력
4. 최종 금액 확인
5. "생성" 버튼 클릭
6. 성공 메시지 확인
7. 견적서 목록에서 생성된 견적서 확인

---

## 📊 데이터 흐름

```
[설정 - 단가 관리]
        ↓
  /api/pricings
        ↓
[견적서 생성 - 광고 상품 선택]
        ↓
  pricingId 전송
        ↓
  /api/quote-items/bulk
        ↓
  adProductId로 매핑
        ↓
[Airtable Quote_Items]
  (Ad Product 필드에 pricingId 저장)
```

---

## 🔄 향후 개선 방향

### 1. Airtable 스키마 개선 (선택사항)

현재는 `pricingId`를 `Ad Product` 필드에 저장하지만, 더 명확한 구조를 위해:

**제안 구조**:
```
Quote_Items 테이블:
├── Quote (Link to Quotes) - 기존
├── Ad Product (Link to Ad_Products) - 기존, 레거시 지원
├── Pricing (Link to Pricings) - 신규 추가
├── Quantity (Number) - 기존
├── Unit Price (Number) - 기존
└── Subtotal (Formula: Quantity × Unit Price) - 기존
```

**마이그레이션 단계**:
1. Quote_Items 테이블에 `Pricing` 링크 필드 추가
2. 백엔드 코드에서 `Pricing` 필드 사용하도록 수정
3. 기존 데이터 마이그레이션 스크립트 실행
4. `Ad Product` 필드는 하위 호환성을 위해 유지

### 2. 단가 변경 이력 관리

견적서 생성 시점의 단가를 고정하여, 단가표 변경 시에도 기존 견적서는 변경되지 않도록:

```typescript
// 견적 품목 생성 시 단가 스냅샷 저장
const newItem = {
  pricingId: pricing.id,
  productName: pricing.productName,
  unitPrice: currentPrice, // 현재 시점의 가격 고정
  priceSnapshot: {
    price: pricing.price,
    specs: pricing.specs,
    description: pricing.description,
    snapshotAt: new Date().toISOString(),
  },
};
```

### 3. 대량 견적서 생성

여러 광고주에게 동일한 상품 구성으로 견적서를 일괄 생성:

```typescript
// 대량 생성 UI
<MultiSelect
  advertisers={advertisers}
  onSelect={handleBulkCreate}
/>
```

---

## ✅ 체크리스트

설정 완료 확인:

- [ ] 설정 → 단가 관리에 상품이 1개 이상 등록됨
- [ ] 광고주가 1명 이상 등록됨 (Active 상태)
- [ ] 브라우저에서 로그인 완료
- [ ] 견적서 생성 다이얼로그 정상 작동
- [ ] 광고주 검색 기능 작동
- [ ] 단가표 상품 선택 가능
- [ ] 품목 추가 및 삭제 정상 작동
- [ ] 견적서 생성 성공

---

## 🐛 알려진 제한사항

### 1. Airtable 필드명 매핑
- 프론트엔드: `pricingId`
- 백엔드: `adProductId` (내부 변환)
- Airtable: `Ad Product` 필드에 저장

이는 Airtable 스키마 변경 없이 새 기능을 구현하기 위한 임시 해결책입니다.

### 2. 단가 변경 영향
단가표에서 가격을 변경하면:
- ✅ 새로 생성하는 견적서에 반영됨
- ❌ 기존 견적서는 변경되지 않음 (의도된 동작)

### 3. 품목 순서
품목 추가 순서가 유지되지만, Airtable에서 직접 수정 시 순서가 변경될 수 있습니다.

---

## 🎯 결론

**개선 효과**:
- ✅ 광고주 선택 시간 단축 (검색 기능)
- ✅ 단가표 중앙 관리로 데이터 일관성 향상
- ✅ 사용자 경험 개선 (스크롤, 검색, 상세 정보 표시)
- ✅ 하위 호환성 유지로 안전한 배포

**즉시 사용 가능**: ✅
- 서버 재시작 필요 없음
- Airtable 스키마 변경 불필요
- 기존 데이터와 호환

**테스트 URL**: https://5000-id0z0fbnwb7iagiorzba0-82b888ba.sandbox.novita.ai

1. 로그인 후 "견적서" 메뉴 클릭
2. "견적서 생성" 버튼 클릭
3. 개선된 UI 확인
