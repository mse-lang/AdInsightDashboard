# Venture Square Ad Management System (VS-AMS)

## Overview
VS-AMS is a comprehensive advertising management system for Venture Square, managing the entire advertising sales lifecycle from inquiry to payment. It is currently migrating to an Airtable-based architecture. Key capabilities include Google OAuth with role-based access, Airtable as the primary data store, multi-channel communication (Email/SMS/KakaoTalk), campaign and creative asset management, automated quote generation and invoicing, integration with Google Calendar, Gmail, GA4, performance analytics, and management of advertiser-agency relationships and inquiries.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**Framework**: React with TypeScript (Vite).
**UI Component System**: Shadcn/ui (Radix UI primitives) with Tailwind CSS, following Material Design principles adapted for Korean SaaS applications (Pretendard font).
**Routing**: Wouter.
**State Management**: React Query for server state, React Hook Form with Zod for form validation, React hooks for local component state.
**Key Design Decisions**: New York style Shadcn/ui, Korean-first UI, responsive design, custom CSS variables.

### Backend Architecture
**Framework**: Express.js with TypeScript (Node.js).
**API Pattern**: RESTful API with JSON responses, standard CRUD, conventional HTTP methods, and error handling.
**Data Layer**: Storage abstraction through `IStorage` interface.

### Data Storage Solutions
**ORM**: Drizzle ORM.
**Database**: PostgreSQL via Neon serverless driver.
**Schema Design**: Includes `advertisers`, `memos`, `adSlots`, `adMaterials`, `quotes`, `materials`, `pricing`. Employs serial IDs, text fields, array fields for attachments, and timestamp tracking. Zod schema validation derived from Drizzle schemas.

### Authentication and Authorization
Currently disabled for public access, but Google OAuth, email-based magic link, and PostgreSQL-backed sessions code is preserved for future re-enablement.

### Key Architectural Patterns
**Full-Stack TypeScript**: Shared types between client and server via a `@shared` directory.
**Path Aliases**: Organized aliases for client source files, shared schemas, and static assets.
**API Request Pattern**: Centralized `apiRequest` function.
**Query Client Configuration**: Infinite stale time and disabled automatic refetching.
**Component Organization**: Clear separation of pages, reusable components, UI primitives.

## External Dependencies
**UI Components**: Radix UI primitives, Lucide React, Recharts, date-fns, CMDK.
**Database Connection**: Neon serverless PostgreSQL, `@neondatabase/serverless`.
**Form Handling**: React Hook Form, Zod, `@hookform/resolvers`.
**Styling**: Tailwind CSS, PostCSS, Class Variance Authority (CVA), clsx, tailwind-merge.
**Messaging**: Solapi for SMS and KakaoTalk.
**Primary Data Store**: Airtable.
**Google Services**: Google OAuth, Google Calendar, Gmail, Google Analytics 4 (GA4).
**Newsletter Analytics**: Stibee API v2.