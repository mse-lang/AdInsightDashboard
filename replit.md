# Venture Square Ad Management Dashboard

## Overview

A Korean-language advertising management dashboard for Venture Square, built to streamline the entire advertising sales lifecycle from initial inquiry through invoicing and payment tracking. The application manages advertisers, ad slots, quotes, materials, and performance analytics with a focus on Korean business workflows and terminology.

**Public Access**: The application is publicly accessible without authentication requirements, designed for internal use within a trusted network environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**2025-10-26**: Removed authentication system
- Disabled email-based magic link authentication
- Application now directly accessible without login
- Removed login and verification pages from routing
- Authentication routes commented out in server (can be re-enabled if needed)
- Users can access all features immediately upon visiting the application URL

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