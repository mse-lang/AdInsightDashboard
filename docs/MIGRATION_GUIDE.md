# VS-AMS Migration Guide

## Migration Strategy

### Overview
This document outlines the step-by-step migration from PostgreSQL-based architecture to Airtable-primary architecture while maintaining the current React + Express tech stack.

---

## Pre-Migration Checklist

### 1. Backup Current System
- [x] Requirements document saved to `docs/requirements/`
- [ ] Current database schema exported
- [ ] Git commit of working state
- [ ] Environment variables documented

### 2. External Service Setup
- [ ] Airtable account and base created
- [ ] Google Cloud Project configured (OAuth, Calendar, Gmail, GA4)
- [ ] Solapi account setup
- [ ] File storage (S3 or GCS) configured

### 3. API Keys and Secrets
Required secrets in Replit:
- `AIRTABLE_API_KEY` - Personal access token
- `AIRTABLE_BASE_ID` - Base identifier
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `SOLAPI_API_KEY` - Solapi API key
- `SOLAPI_API_SECRET` - Solapi secret
- `STORAGE_BUCKET` - S3/GCS bucket name
- `STORAGE_ACCESS_KEY` - Storage access credentials

---

## Migration Phases

### Phase 1: Foundation (Week 1-2)

#### 1.1 Airtable Integration
**Goal**: Replace PostgreSQL with Airtable as primary data store

**Tasks**:
1. Install Airtable.js SDK: `npm install airtable`
2. Create `server/airtable/` directory structure:
   ```
   server/airtable/
   ├── client.ts          # Airtable client configuration
   ├── base.ts            # Base instance
   ├── tables/
   │   ├── users.ts       # Users table operations
   │   ├── advertisers.ts # Advertisers table operations
   │   └── ...
   └── types.ts           # TypeScript types for Airtable records
   ```
3. Implement AirtableStorage class implementing IStorage interface
4. Add caching layer (Redis or in-memory) for frequently accessed data

**Testing**:
- CRUD operations for each table
- Relationship linking works correctly
- Rate limiting handles API constraints

#### 1.2 Google OAuth Authentication
**Goal**: Implement secure authentication with role-based access

**Tasks**:
1. Install Passport Google OAuth: `npm install passport passport-google-oauth20`
2. Configure OAuth routes in `server/routes.ts`
3. Implement user profile sync with Airtable Users table
4. Add role-based middleware (admin vs user)
5. Update frontend to handle OAuth flow

**Testing**:
- Login with whitelisted admin emails
- Login with non-admin emails
- Session persistence
- Role-based route protection

**Files to Modify**:
- `server/auth.ts` - OAuth strategy
- `client/src/pages/login.tsx` - OAuth button
- `client/src/hooks/useAuth.tsx` - Auth context

---

### Phase 2: Core Modules (Week 3-4)

#### 2.1 Advertiser Management (Module 2)
**Requirements**: FR-2.1 to FR-2.5

**Tasks**:
1. Migrate advertisers page to use Airtable
2. Add search and filter functionality
3. Implement detail view with communication history
4. Add Solapi integration for sending messages

**New Components**:
- `client/src/pages/advertisers.tsx` - List view with filters
- `client/src/pages/advertiser-detail.tsx` - Detail with comms
- `client/src/components/communication-panel.tsx` - Send messages UI

**Backend Routes**:
- `GET /api/advertisers` - List with search/filter
- `GET /api/advertisers/:id` - Detail
- `POST /api/advertisers` - Create
- `PATCH /api/advertisers/:id` - Update
- `POST /api/advertisers/:id/send-message` - Send via Solapi

#### 2.2 Quote and Billing (Module 4)
**Requirements**: FR-4.1 to FR-4.5

**Tasks**:
1. Build quote generation UI
2. Implement PDF generation (using jspdf or puppeteer)
3. Connect to Quotes and Quote_Items tables
4. Add invoice tracking
5. Create billing dashboard

**New Components**:
- `client/src/pages/quotes.tsx` - Quote management
- `client/src/components/quote-generator.tsx` - Interactive quote builder
- `client/src/pages/invoices.tsx` - Invoice tracking

**Backend Routes**:
- `POST /api/quotes` - Create quote
- `GET /api/quotes/:id/pdf` - Generate PDF
- `POST /api/quotes/:id/send` - Email quote to advertiser
- `POST /api/invoices` - Create invoice from quote

---

### Phase 3: Advanced Features (Week 5-6)

#### 3.1 Campaign & Creative Management (Module 3)
**Requirements**: FR-3.1 to FR-3.5

**Tasks**:
1. Campaign CRUD with Airtable
2. File upload to S3/GCS
3. Image resizing worker (Sharp library)
4. Creative review workflow
5. UTM parameter generation

**New Components**:
- `client/src/pages/campaigns.tsx` - Campaign list
- `client/src/pages/campaign-detail.tsx` - Campaign management
- `client/src/components/creative-uploader.tsx` - File upload UI
- `client/src/components/creative-review.tsx` - Approval workflow

**Background Jobs**:
- Image resizing on upload
- Generate variants for different dimensions

#### 3.2 Google Integrations (Module 5)
**Requirements**: FR-5.1 to FR-5.4

**Tasks**:
1. Google Calendar API integration
2. Campaign → Calendar event sync
3. Gmail API for inbound email classification
4. Set up Pub/Sub for Gmail watch

**Backend Services**:
- `server/services/google-calendar.ts` - Calendar sync
- `server/services/gmail-monitor.ts` - Email monitoring
- `server/workers/gmail-processor.ts` - Process inbound emails

---

### Phase 4: Analytics & Automation (Week 7)

#### 4.1 GA4 Integration (Module 6)
**Requirements**: FR-6.1 to FR-6.5

**Tasks**:
1. Google Analytics Data API setup
2. Scheduled job to fetch campaign metrics
3. Store results in Reports table
4. Build analytics dashboard
5. Automated report generation and sending

**New Components**:
- `client/src/pages/analytics.tsx` - Dashboard with charts
- `client/src/components/performance-chart.tsx` - Recharts visualizations

**Background Jobs**:
- Daily GA4 data collection
- Weekly/monthly report generation
- Automated report email sending

#### 4.2 Background Workers
**Requirements**: Non-functional requirements (automation)

**Tasks**:
1. Install BullMQ: `npm install bullmq ioredis`
2. Set up Redis for job queue
3. Create worker processes:
   - Image processing
   - GA4 data collection
   - Report generation
   - Email scheduling
4. Add job monitoring dashboard (optional)

**Worker Structure**:
```
server/workers/
├── image-processor.ts
├── ga4-collector.ts
├── report-generator.ts
└── email-scheduler.ts
```

---

## Data Migration Strategy

### Existing PostgreSQL Data
**Decision**: PostgreSQL will remain for session storage only

**Migration Steps**:
1. Export critical data from PostgreSQL (if any valuable data exists)
2. Transform to Airtable format
3. Import via Airtable API or CSV upload
4. Verify data integrity
5. Update references

### Session Management
- Keep `connect-pg-simple` for session storage
- PostgreSQL stores only sessions, not business data
- Airtable handles all business entities

---

## Testing Strategy

### Unit Tests
- Airtable table operations
- Google API interactions
- Solapi message sending
- PDF generation

### Integration Tests
- End-to-end user flows
- OAuth login → data access
- Quote creation → PDF → email
- Campaign creation → Calendar sync

### Performance Tests
- Airtable rate limit handling
- Large dataset rendering
- File upload/processing time
- Report generation time

---

## Rollback Plan

If migration encounters critical issues:

1. **Immediate rollback**: Restore from backup
2. **Data preservation**: Export all Airtable data to CSV
3. **Code rollback**: Git revert to pre-migration state
4. **Communication**: Notify stakeholders of rollback
5. **Analysis**: Document issues for future attempt

---

## Post-Migration Checklist

- [ ] All features from requirements document working
- [ ] Performance meets SLAs (3s page load, 2min image processing)
- [ ] Security audit passed (secrets, OAuth, API keys)
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Training materials created
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 2 weeks | Airtable + OAuth working |
| Phase 2 | 2 weeks | Advertisers + Quotes functional |
| Phase 3 | 2 weeks | Campaigns + Google integrations |
| Phase 4 | 1 week | Analytics + Automation |
| **Total** | **7 weeks** | Full VS-AMS system operational |

---

## Success Criteria

Migration is considered successful when:

1. ✅ All Must-have requirements (FR-X.X with "Must" priority) implemented
2. ✅ Airtable is primary data source for all entities
3. ✅ Google OAuth authentication working for admin/user roles
4. ✅ Solapi integration sending emails/SMS successfully
5. ✅ Quote PDF generation and email delivery working
6. ✅ Campaign calendar sync operational
7. ✅ GA4 data collection and reporting functional
8. ✅ System performance meets benchmarks
9. ✅ Security audit passed
10. ✅ User acceptance testing completed

---

## Support Resources

- Airtable API Docs: https://airtable.com/developers/web/api/introduction
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Solapi Docs: https://docs.solapi.com/
- BullMQ Guide: https://docs.bullmq.io/

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Next Review**: After Phase 1 completion
