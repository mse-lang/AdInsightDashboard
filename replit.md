# Venture Square Ad Management System (VS-AMS)

## Overview

VS-AMS is a comprehensive advertising management system for Venture Square, designed to manage the entire advertising sales lifecycle. It covers initial inquiry through campaign execution, performance tracking, invoicing, and payment management. The project is currently migrating to an Airtable-based architecture.

**Key Capabilities**:
- Google OAuth authentication with role-based access control.
- Airtable as the primary data store with PostgreSQL for session management.
- Multi-channel communication via Solapi (Email/SMS/KakaoTalk).
- Campaign and creative asset management.
- Automated quote generation and invoice tracking.
- Integration with Google Calendar, Gmail, and GA4.
- Performance analytics and automated reporting.
- Management of advertiser-agency relationships and integrated advertising inquiries.
- Stibee API v2 integration for newsletter analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**2025-11-16**: **Advertiser CSV Import/Export Enhancement** ✅
- ✅ **Enhanced CSV Download**:
  - Expanded to 12 fields: 광고주, 사업자번호, 사업자등록번호, 계좌번호, 광고소재, 담당자, 담당자구분, 에이전시, 이메일, 전화번호, 업종, 상태
  - RFC 4180 compliant quote escaping (" → "")
  - Contact person type Korean translation (Advertiser → 광고주, Agency → 에이전시)
  - UTF-8 BOM for Excel compatibility
- ✅ **RFC 4180 CSV Parser**:
  - State-based character parsing
  - Handles quoted commas and quotes correctly
  - Preserves all whitespace (no trim)
  - Supports both CRLF and LF line endings
  - Automatic quote unescaping ("" → ")
- ✅ **Enhanced CSV Upload**:
  - Processes all 12 fields
  - Agency name to ID mapping
  - Contact person type Korean to English conversion
  - New fields: businessRegistrationNumber, bankAccountNumber, adMaterials
  - Field count validation and error handling
  - Success/failure count with toast notifications
- ✅ **Known Limitation**:
  - Does not support newlines within quoted fields (very rare in practice)
  - User accepted this limitation for simplicity

**2025-11-16**: **Dashboard Calendar - Navigable Calendar View** ✅
- ✅ **Navigable Calendar Component**:
  - Created NavigableCalendar component replacing ThreeMonthCalendar
  - Current month displayed as Google Calendar iframe (500px height)
  - Previous and next months shown as event list views
  - Left/right navigation buttons to switch between months
  - Month indicator showing "YYYY년 MM월" format
- ✅ **Event List Views**:
  - Event filtering by month based on startDate/endDate overlap
  - Displays advertiser name, slot, date range, and status badge
  - Status badges with dark mode support (부킹확정: blue, 집행중: green)
  - Empty state message: "예약 없음"
- ✅ **State Management**:
  - Month/year tracking with useState
  - React Query for calendar events data
  - Loading and error states with user-friendly messages
- ✅ **Responsive Layout**:
  - 3-column grid on large screens (3-6-3 layout)
  - Single column on mobile devices
  - All interactive elements include data-testid attributes

**2025-11-16**: **General Settings - Bank Information** ✅
- ✅ **Bank Information Fields**:
  - Added bankName and bankAccountNumber to general settings
  - Settings stored in Airtable System Settings table (Category: 'General')
  - Key-value storage pattern: BankName, BankAccountNumber
- ✅ **Settings API**:
  - GET /api/settings/general - Fetch general settings
  - PATCH /api/settings/general - Update settings with authentication guard
  - Incremental update support (only changed fields are updated)
- ✅ **Settings UI**:
  - Bank name input field with placeholder (예: 국민은행)
  - Bank account number input field with placeholder (예: 123-45-678910)
  - Save button disabled when no changes or during mutation
  - Proper loading states and toast notifications
  - All fields include data-testid attributes

**2025-11-16**: **Advertiser-Agency Relationship System Complete** ✅
- ✅ **Agencies Management**:
  - New Agency entity with full CRUD operations
  - AgencyFields: name, business registration number, contact person, email, phone, status, notes, advertisers (linked field)
  - Airtable table functions: getAllAgencies, getAgencyById, createAgency, updateAgency, deleteAgency
  - Complete API routes: GET /api/agencies, GET /api/agencies/:id, POST /api/agencies, PATCH /api/agencies/:id, DELETE /api/agencies/:id
  - Frontend agencies management page with search, filtering, and CRUD dialogs
- ✅ **Enhanced Advertiser Fields**:
  - Added businessRegistrationNumber, bankAccountNumber, adMaterials fields
  - Added contactPersonType enum ("Advertiser" | "Agency")
  - Added agency relationship (linked to Agencies table)
  - Campaign history display (campaign count badge)
- ✅ **UI Updates**:
  - Changed "회사명" label to "광고주" throughout advertiser interface
  - Contact person type badge display (에이전시/광고주)
  - Agency selection dropdown (appears when contact type is "Agency")
  - Campaign count display in advertiser list
  - Comprehensive data-testid coverage on all interactive and display elements
- ✅ **API Enhancements**:
  - Updated advertiser CRUD to handle new fields with Zod validation
  - Proper error handling (400/404/500/503 status codes)
  - Authentication guards on mutation endpoints

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript (Vite).
**UI Component System**: Shadcn/ui (Radix UI primitives) with Tailwind CSS, following Material Design principles adapted for Korean SaaS applications (Pretendard font).
**Routing**: Wouter.
**State Management**: React Query for server state, React Hook Form with Zod for form state and validation, React hooks for local component state.
**Key Design Decisions**: New York style Shadcn/ui, Korean-first UI with specific workflows, responsive design, custom CSS variables for them.

### Backend Architecture

**Framework**: Express.js with TypeScript (Node.js).
**API Pattern**: RESTful API with JSON responses, standard CRUD operations, conventional HTTP methods, and appropriate error handling.
**Data Layer**: Storage abstraction through `IStorage` interface for database flexibility.

### Data Storage Solutions

**ORM**: Drizzle ORM.
**Database**: PostgreSQL via Neon serverless driver.
**Schema Design**: Includes `advertisers`, `memos`, `adSlots`, `adMaterials`, `quotes`, `materials`, `pricing`. Employs serial IDs, text fields for flexible data (e.g., status values), array fields for attachments, and timestamp tracking. Zod schema validation is derived from Drizzle schemas.

### Authentication and Authorization

**Status**: Currently disabled. The system is publicly accessible. Authentication code (Google OAuth, email-based magic link, PostgreSQL-backed sessions) is preserved and commented out for future re-enablement.

### Key Architectural Patterns

**Full-Stack TypeScript**: Shared types between client and server via a `@shared` directory.
**Path Aliases**: Organized aliases for client source files, shared schemas, and static assets.
**API Request Pattern**: Centralized `apiRequest` function for consistent handling.
**Query Client Configuration**: Infinite stale time and disabled automatic refetching for manual cache management.
**Component Organization**: Clear separation of pages, reusable components, UI primitives, and examples.

## External Dependencies

**UI Components**: Radix UI primitives, Lucide React, Recharts, date-fns, CMDK.
**Development Tools**: Replit-specific plugins, ESBuild, Drizzle Kit.
**Database Connection**: Neon serverless PostgreSQL, `@neondatabase/serverless`.
**Form Handling**: React Hook Form, Zod, `@hookform/resolvers`.
**Styling**: Tailwind CSS, PostCSS, Class Variance Authority (CVA), clsx, tailwind-merge.
**Session Management**: connect-pg-simple (currently disabled).
**Email Service**: Resend (configured but unused for magic links).
**Messaging**: Solapi for SMS and KakaoTalk.
**Primary Data Store**: Airtable.
**Google Services**: Google OAuth, Google Calendar, Gmail, Google Analytics 4 (GA4).
**Newsletter Analytics**: Stibee API v2.