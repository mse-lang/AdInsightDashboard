# VS-AMS Airtable Schema Design

## Base Overview

Base Name: `VS-AMS Production`
Purpose: Primary data store for all advertising management entities

## Table Structures

### 1. Users
**Purpose**: User account and permission management

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Name | Single line text | Full name | Yes |
| Email | Email | Google account email | Yes |
| Google UID | Single line text | Google OAuth user ID | Yes |
| Role | Single select | Admin / User / ReadOnly | Yes |
| Status | Single select | Active / Inactive | Yes |
| Created | Created time | Auto-generated | Auto |
| Last Modified | Last modified time | Auto-generated | Auto |

**Admin emails**: mse@venturesquare.net, rosie@venturesquare.net

---

### 2. Advertisers
**Purpose**: Client company profiles and contact information

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Company Name | Single line text | 회사명 | Yes |
| Business Number | Single line text | 사업자등록번호 | No |
| Contact Person | Single line text | 담당자 이름 | Yes |
| Email | Email | 담당자 이메일 | Yes |
| Phone | Phone number | 연락처 | Yes |
| Industry | Single select | 산업군 | No |
| Account Manager | Link to Users | 담당 AE | Yes |
| Status | Single select | Lead / Active / Inactive | Yes |
| Communication Logs | Link to Communication_Logs | 커뮤니케이션 기록 | - |
| Campaigns | Link to Campaigns | 진행 캠페인 | - |
| Quotes | Link to Quotes | 견적 내역 | - |
| Created | Created time | Auto-generated | Auto |
| Last Modified | Last modified time | Auto-generated | Auto |

---

### 3. Communication_Logs
**Purpose**: Email, SMS, KakaoTalk communication tracking

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Advertiser | Link to Advertisers | 관련 광고주 | Yes |
| Type | Single select | Email / SMS / KakaoTalk / Inbound Email | Yes |
| Subject | Single line text | 제목 | No |
| Content | Long text | 본문 내용 | Yes |
| Sender | Link to Users | 발신자 (아웃바운드) | No |
| Status | Single select | Sent / Failed / Delivered / Read | Yes |
| Sent At | Date & time | 발송 시간 | Auto |
| External ID | Single line text | Solapi/Gmail Message ID | No |
| Attachments | Attachment | 첨부 파일 | No |
| Created | Created time | Auto-generated | Auto |

---

### 4. Ad_Products
**Purpose**: Advertising product catalog

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Product Name | Single line text | 상품명 | Yes |
| Description | Long text | 상품 설명 | No |
| Format | Single select | Banner / Newsletter / Native / Video | Yes |
| Dimensions | Single line text | 규격 (e.g., 300x250) | No |
| Position | Single line text | 노출 위치 | No |
| Unit Price | Currency | 단가 | Yes |
| Status | Single select | Active / Inactive | Yes |
| Created | Created time | Auto-generated | Auto |
| Last Modified | Last modified time | Auto-generated | Auto |

---

### 5. Campaigns
**Purpose**: Campaign scheduling and tracking

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Campaign Name | Single line text | 캠페인명 | Yes |
| Advertiser | Link to Advertisers | 광고주 | Yes |
| Ad Products | Link to Ad_Products | 광고 상품 (multiple) | Yes |
| Start Date | Date | 시작일 | Yes |
| End Date | Date | 종료일 | Yes |
| Status | Single select | Planning / Active / Completed / Cancelled | Yes |
| Pipeline Status | Single select | 문의중 / 견적제시 / 일정조율중 / 부킹확정 / 집행중 / 결과보고 / 세금계산서 발행 및 대금 청구 / 매출 입금 | Yes |
| UTM Campaign | Single line text | UTM 파라미터 | Auto |
| Google Calendar ID | Single line text | Calendar Event ID | No |
| Creatives | Link to Creatives | 관련 소재 | - |
| Reports | Link to Reports | 성과 리포트 | - |
| Created | Created time | Auto-generated | Auto |
| Last Modified | Last modified time | Auto-generated | Auto |

**Pipeline Status 설명**:
- **문의중**: 광고 문의 접수
- **견적제시**: 견적서 발송
- **일정조율중**: 광고 일정 조율
- **부킹확정**: 광고 슬롯 부킹 완료
- **집행중**: 캠페인 실행 중
- **결과보고**: 성과 리포트 발송
- **세금계산서 발행 및 대금 청구**: 세금계산서 발행 및 청구
- **매출 입금**: 대금 입금 완료

---

### 6. Creatives
**Purpose**: Advertising creative asset management

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Name | Single line text | 소재명 | Yes |
| Advertiser | Link to Advertisers | 광고주 | Yes |
| Campaign | Link to Campaigns | 캠페인 | No |
| File URL | URL | 원본 파일 URL (S3/GCS) | Yes |
| File Type | Single select | Image / Video | Yes |
| Status | Single select | Pending / Approved / Rejected | Yes |
| Review Notes | Long text | 검수 메모 | No |
| Variants | Link to Creative_Variants | 규격별 변환본 | - |
| Created | Created time | Auto-generated | Auto |
| Last Modified | Last modified time | Auto-generated | Auto |

---

### 7. Creative_Variants (Optional)
**Purpose**: Dimension-specific converted assets

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Original Creative | Link to Creatives | 원본 소재 | Yes |
| Dimensions | Single line text | 규격 (e.g., 300x250) | Yes |
| File URL | URL | 변환된 파일 URL | Yes |
| Created | Created time | Auto-generated | Auto |

---

### 8. Quotes
**Purpose**: Quote header information

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Quote Number | Auto number | 견적서 번호 | Auto |
| Advertiser | Link to Advertisers | 광고주 | Yes |
| Total Amount | Currency | 총액 | Yes |
| Discount Rate | Percent | 할인율 | No |
| Final Amount | Formula | Total - Discount | Auto |
| Status | Single select | Draft / Sent / Approved / Rejected | Yes |
| PDF URL | URL | 견적서 PDF 링크 | No |
| Quote Items | Link to Quote_Items | 견적 항목 | - |
| Invoice | Link to Invoices | 세금계산서 | - |
| Sent At | Date & time | 발송 시간 | No |
| Created | Created time | Auto-generated | Auto |
| Last Modified | Last modified time | Auto-generated | Auto |

---

### 9. Quote_Items
**Purpose**: Individual line items in quotes

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Quote | Link to Quotes | 견적서 | Yes |
| Ad Product | Link to Ad_Products | 광고 상품 | Yes |
| Quantity | Number | 수량 | Yes |
| Unit Price | Currency | 단가 | Yes |
| Subtotal | Formula | Quantity × Unit Price | Auto |
| Duration | Number | 기간 (일) | No |
| Created | Created time | Auto-generated | Auto |

---

### 10. Invoices
**Purpose**: Tax invoice tracking

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Invoice Number | Auto number | 세금계산서 번호 | Auto |
| Quote | Link to Quotes | 연결된 견적 | Yes |
| Advertiser | Lookup from Quote | 광고주 | Auto |
| Amount | Currency | 금액 | Yes |
| Status | Single select | Pending / Issued / Paid / Overdue | Yes |
| Issue Date | Date | 발행일 | No |
| Due Date | Date | 만기일 | No |
| Payment Date | Date | 입금일 | No |
| Notes | Long text | 비고 | No |
| Created | Created time | Auto-generated | Auto |
| Last Modified | Last modified time | Auto-generated | Auto |

---

### 11. Reports
**Purpose**: Performance data and report files

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Report Name | Single line text | 리포트명 | Yes |
| Campaign | Link to Campaigns | 캠페인 | Yes |
| Advertiser | Lookup from Campaign | 광고주 | Auto |
| Period Start | Date | 기간 시작 | Yes |
| Period End | Date | 기간 종료 | Yes |
| Impressions | Number | 노출 수 | No |
| Clicks | Number | 클릭 수 | No |
| CTR | Formula | (Clicks / Impressions) × 100 | Auto |
| Conversions | Number | 전환 수 | No |
| Report URL | URL | 리포트 파일 URL (PDF) | No |
| Status | Single select | Generating / Completed / Sent | Yes |
| Sent At | Date & time | 발송 시간 | No |
| Created | Created time | Auto-generated | Auto |

---

### 12. System_Settings
**Purpose**: API keys, templates, and configuration

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Category | Single select | Solapi / Google / General | Yes |
| Key | Single line text | 설정 키 | Yes |
| Value | Long text | 설정 값 | Yes |
| Description | Long text | 설명 | No |
| Last Modified | Last modified time | Auto-generated | Auto |

**Example entries**:
- Category: Solapi, Key: email_template_quote, Value: [Template content]
- Category: Google, Key: calendar_id, Value: [Calendar ID]
- Category: Solapi, Key: kakao_template_id, Value: [Template ID]

---

## Relationships Summary

```
Users
  ├─> Advertisers (as Account Manager)
  └─> Communication_Logs (as Sender)

Advertisers
  ├─> Communication_Logs
  ├─> Campaigns
  ├─> Quotes
  └─> Creatives

Campaigns
  ├─> Creatives
  └─> Reports

Quotes
  ├─> Quote_Items
  └─> Invoices

Creatives
  └─> Creative_Variants
```

---

## API Access Strategy

### Rate Limits
- Airtable: 5 requests/second per base
- Strategy: Implement caching and request queuing

### Data Sync
- Real-time: User actions (create/update)
- Cached: List views (15-minute cache)
- Scheduled: GA4 data collection (daily)

### Security
- API key stored in Replit Secrets
- Row-level permissions via API filtering
- Sensitive fields (API keys in System_Settings) require admin role

---

## Next Steps

1. Create Airtable base with above structure
2. Populate System_Settings with initial configuration
3. Add sample data for testing
4. Generate Airtable API key and store in Replit Secrets
5. Implement Airtable SDK integration in backend
