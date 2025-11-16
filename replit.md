# Venture Square Ad Management System (VS-AMS)

## Overview

VS-AMS is a comprehensive advertising management system for Venture Square media company. The system streamlines the entire advertising sales lifecycle from initial inquiry through campaign execution, performance tracking, invoicing, and payment management.

**Project Status**: Migration to Airtable-based architecture in progress (Started: 2025-11-16)

**Key Features**:
- Google OAuth authentication with role-based access control
- Airtable as primary data store with PostgreSQL for session management
- Multi-channel communication (Solapi: Email/SMS/KakaoTalk)
- Campaign and creative asset management
- Automated quote generation and invoice tracking
- Google Calendar, Gmail, and GA4 integration
- Performance analytics and automated reporting

## User Preferences

Preferred communication style: Simple, everyday language.

## Project Migration Plan

**Migration Approach**: Incremental transformation of existing React + Express application to Airtable-based architecture while maintaining current tech stack.

**Phase 1 - Foundation** (Weeks 1-2):
- Airtable base design and API integration
- Google OAuth authentication system
- User management with Airtable Users table

**Phase 2 - Core Modules** (Weeks 3-4):
- Advertiser management (Module 2)
- Quote and billing (Module 4)
- Solapi integration for communications

**Phase 3 - Advanced Features** (Weeks 5-6):
- Campaign and creative management (Module 3)
- Google Calendar/Gmail integration (Module 5)
- GA4 analytics and reporting (Module 6)

**Phase 4 - Automation** (Week 7):
- Background workers (BullMQ/Redis)
- Automated email/SMS scheduling
- Performance report generation

## Recent Changes

**2025-11-16**: **Phase 2 Module 4 Complete** ✅ - Quote & Billing Module
- ✅ **Production-ready** Airtable table functions: Quotes, Quote Items, Invoices (full CRUD)
- ✅ Complete API routes with authentication guards and Airtable credential checks
- ✅ Fixed critical autoNumber field sorting issue (removed dependencies on Quote Number/Invoice Number)
- ✅ Comprehensive Zod validation with robust error handling (400/404/500/503 status codes)
- ✅ Invoice advertiser linkage: Automatically extracts advertiser from Quote relationship
- ✅ Frontend TypeScript type definitions for all three entities
- ✅ **Complete CRUD API endpoints**:
  - Quotes: GET /api/quotes, GET /api/quotes/:id, GET /api/quotes/advertiser/:id, GET /api/quotes/status/:status, POST, PATCH, DELETE, POST /api/quotes/:id/approve
  - Quote Items: GET /api/quotes/:quoteId/items, **GET /api/quote-items/:id**, POST /api/quote-items, POST /api/quote-items/bulk, PATCH /api/quote-items/:id, DELETE /api/quote-items/:id
  - Invoices: GET /api/invoices, GET /api/invoices/:id, GET /api/invoices/quote/:id, GET /api/invoices/status/:status, GET /api/invoices/overdue, POST (with auto-advertiser), PATCH, DELETE
- 📝 **Next**: Solapi integration for multi-channel communications (Email/SMS/KakaoTalk)

**2025-11-16**: **Phase 2 Start** - Advertiser Management API
- ✅ Communication Logs Airtable table functions (CRUD operations)
- ✅ Advertiser API routes migrated to Airtable with production-ready error handling
- ✅ Authentication guards on all mutation endpoints (POST/PATCH/DELETE)
- ✅ Comprehensive validation with Zod (string trimming, email validation, status enums)
- ✅ Proper HTTP status codes: 400 (validation), 404 (not found), 500 (server error), 503 (service unavailable)
- ✅ Airtable credentials checking with graceful degradation
- ✅ Frontend Airtable type definitions and advertiser list page

**2025-11-16**: **Phase 1 Complete** - Foundation Layer
- ✅ Airtable integration layer with 12-table type system
- ✅ Google OAuth authentication with Passport.js
- ✅ Development mode with in-memory user store (works without Airtable/OAuth credentials)
- ✅ Automated Airtable base setup script
- ✅ Session management with PostgreSQL
- ✅ E2E tested: Dev login → Dashboard → Logout flow verified

**Migration Strategy**:
- Migrating from PostgreSQL-only to Airtable-primary architecture
- Preserving React + Express stack for rapid development
- Graceful fallback: System works in dev mode without any credentials

**Technical Constraints**:
- autoNumber fields (Quote Number, Invoice Number) cannot be created via Airtable Meta API
- autoNumber fields must be manually added in Airtable UI or cannot be used for sorting
- All quote/invoice list queries now sort by creation time instead of auto-generated numbers
- Currency fields require `symbol` option (e.g., `{ precision: 0, symbol: 'KRW' }`)

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: Shadcn/ui components based on Radix UI primitives with Tailwind CSS for styling. The design system follows Material Design principles adapted for Korean SaaS applications, with specific attention to Korean typography (Pretendard font) and business terminology.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router

**State Management**: 
- React Query (TanStack Query) for server state management and data fetching
- React Hook Form with Zod for form state and validation
- Local component state via React hooks

**Key Design Decisions**:
- New York style variant of Shadcn/ui for a professional business aesthetic
- Korean-first UI with status badges and workflows tailored to Korean advertising sales processes
- Responsive design with mobile breakpoint at 768px
- Custom CSS variables for theming with light/dark mode support

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Pattern**: RESTful API with JSON responses
- Standard CRUD operations for resources (advertisers, ad slots, materials, quotes, memos)
- Conventional HTTP methods (GET, POST, PATCH, DELETE)
- Error handling with appropriate HTTP status codes

**Data Layer**: Storage abstraction pattern through `IStorage` interface, enabling flexibility in database implementation

**Development Server**: Vite middleware integration for hot module replacement during development

### Data Storage Solutions

**ORM**: Drizzle ORM for type-safe database operations

**Database**: PostgreSQL via Neon serverless driver with WebSocket support

**Schema Design**:
- `advertisers`: Core entity tracking company information, contact details, status progression, and file uploads (business registration, bank account, logo)
- `memos`: One-to-many relationship with advertisers for tracking communications and file attachments
- `adSlots`: Defines available advertising positions with type and configuration
- `adMaterials`: Links advertisers to specific ad slots with scheduling and file tracking
- `quotes`: Manages quote generation and tracking
- `materials`: Stores marketing materials and introduction documents
- `pricing`: Product pricing configuration

**Key Design Decisions**:
- Serial IDs for all primary keys
- Text fields for flexible data like status values (enabling Korean text)
- Array fields for file attachments
- Timestamp tracking for creation and updates
- Zod schema validation derived from Drizzle schemas for type safety across stack

### Authentication and Authorization

**Status**: Disabled (as of 2025-10-26)

The application is publicly accessible without authentication. All authentication code has been commented out but preserved in the codebase for potential future use:
- Email-based magic link authentication (using Resend)
- Session management with PostgreSQL-backed sessions
- User table and auth tokens table in database schema

**Note**: The authentication infrastructure remains in the codebase (commented out) and can be re-enabled by:
1. Uncommenting auth routes in `server/routes.ts`
2. Uncommenting auth setup in `registerRoutes()`
3. Restoring auth-related imports and components in `client/src/App.tsx`
4. Verifying the domain on Resend for email delivery

**Current Access Model**: Open access - anyone with the application URL can use all features without restriction.

### External Dependencies

**UI Components**: 
- Radix UI primitives (@radix-ui/*) for accessible component foundations
- Lucide React for iconography
- Recharts for data visualization (bar charts, pie charts)
- date-fns for date manipulation and formatting
- CMDK for command palette functionality

**Development Tools**:
- Replit-specific plugins for development environment integration
- ESBuild for production builds
- Drizzle Kit for database migrations

**Database Connection**:
- Neon serverless PostgreSQL with WebSocket support via `ws` package
- Connection pooling through @neondatabase/serverless

**Form Handling**:
- React Hook Form for form state management
- Zod for runtime validation
- @hookform/resolvers for Zod integration

**Styling**:
- Tailwind CSS with PostCSS
- Class Variance Authority (CVA) for component variants
- clsx and tailwind-merge for conditional class management

**Session Management**:
- connect-pg-simple for PostgreSQL-backed sessions (configured but currently disabled)

**Email Service**:
- Resend integration for email delivery (configured but currently unused)
- Magic link authentication system (implemented but disabled)

### Key Architectural Patterns

**Full-Stack TypeScript**: Shared types between client and server via `@shared` directory containing Drizzle schemas

**Path Aliases**: 
- `@/*` → client source files
- `@shared/*` → shared schemas and types
- `@assets/*` → static assets

**API Request Pattern**: Centralized API request handling through `apiRequest` function with automatic error handling and JSON parsing

**Query Client Configuration**: Infinite stale time and disabled automatic refetching for manual cache management

**Component Organization**: 
- Pages in `/pages` directory
- Reusable components in `/components`
- UI primitives in `/components/ui`
- Example implementations in `/components/examples`