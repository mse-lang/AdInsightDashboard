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