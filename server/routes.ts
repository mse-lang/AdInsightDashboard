import type { Express } from "express";
import { createServer, type Server } from "http";
// Legacy PostgreSQL storage - kept for backwards compatibility with non-migrated features
// TODO: Migrate remaining features (Memos, Contacts, Ad Slots) to Airtable
import { storage } from "./storage";
import { insertAdvertiserSchema, insertContactSchema, insertMemoSchema, insertQuoteSchema, insertPricingSchema, insertAdSchema } from "@shared/schema";
import { setupAuth, isAuthenticated, isAdminEmail, createAuthToken, verifyAuthToken, sendMagicLink } from "./auth";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { passport, GOOGLE_AUTH_ENABLED } from "./auth-google";
import type { UserRecord } from "./airtable/tables/users";
import { isAdmin, canEdit, createUser } from "./airtable/tables/users";
import * as agenciesTable from "./airtable/tables/agencies";
import * as advertisersTable from "./airtable/tables/advertisers";
import * as communicationLogsTable from "./airtable/tables/communication-logs";
import * as campaignsTable from "./airtable/tables/campaigns";
import * as quotesTable from "./airtable/tables/quotes";
import * as quoteItemsTable from "./airtable/tables/quote-items";
import * as invoicesTable from "./airtable/tables/invoices";
import * as settingsTable from "./airtable/tables/settings";
import * as adProductsTable from "./airtable/tables/ad-products";
import * as usersTable from "./airtable/tables/users";
import type { AgencyRecord } from "./airtable/tables/agencies";
import type { AdvertiserRecord } from "./airtable/tables/advertisers";
import type { CampaignRecord } from "./airtable/tables/campaigns";
import type { QuoteRecord } from "./airtable/tables/quotes";
import type { QuoteItemRecord } from "./airtable/tables/quote-items";
import type { InvoiceRecord } from "./airtable/tables/invoices";
import type { AdProductRecord } from "./airtable/tables/ad-products";
import { solapiService, SolapiServiceError } from "./services/solapi.service";
import * as gmailService from "./services/gmail.service";
import * as googleSheetsService from "./services/google-sheets.service";
import * as googleCalendarService from "./services/google-calendar.service";
import * as taxInvoicesTable from "./airtable/tables/tax-invoices";
import { getBarobillClient } from "./barobill/client";
import type { TaxInvoiceData } from "./barobill/types";
import { getUncachableResendClient } from "./resendClient";

const ADMIN_EMAIL = 'ad@venturesquare.net';

// Helper for optional string fields - converts empty strings to undefined
const optionalString = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '') ? undefined : val,
  z.string().optional()
);

// Middleware for Airtable-based authentication
const requireAuth = (req: any, res: any, next: any) => {
  // Development mode: auto-populate user if not authenticated
  if (!GOOGLE_AUTH_ENABLED && !req.user) {
    // Return 401 in development to allow frontend to trigger dev login
    return res.status(401).json({ error: 'Authentication required', devMode: true });
  }
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !isAdmin(req.user as UserRecord)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

function transformAgencyForAPI(record: AgencyRecord) {
  return {
    id: record.id,
    name: record.fields['Name'],
    businessRegistrationNumber: record.fields['Business Registration Number'] || '',
    contactPerson: record.fields['Contact Person'],
    email: record.fields['Email'],
    phone: record.fields['Phone'],
    bankName: record.fields['Bank Name'] || '',
    bankAccountNumber: record.fields['Bank Account Number'] || '',
    status: record.fields['Status'],
    notes: record.fields['Notes'] || '',
  };
}

function transformAdvertiserForAPI(record: AdvertiserRecord) {
  return {
    id: record.id,
    companyName: record.fields['Company Name'],
    businessNumber: record.fields['Business Number'] || '',
    businessRegistrationNumber: record.fields['Business Registration Number'] || '',
    bankAccountNumber: record.fields['Bank Account Number'] || '',
    adMaterials: record.fields['Ad Materials'] || '',
    contactPerson: record.fields['Contact Person'],
    contactPersonType: record.fields['Contact Person Type'] || 'Advertiser',
    agencyId: record.fields['Agency']?.[0] || null,
    email: record.fields['Email'],
    phone: record.fields['Phone'],
    industry: record.fields['Industry'] || '',
    status: record.fields['Status'],
    accountManager: record.fields['Account Manager']?.[0] || null,
    campaigns: record.fields['Campaigns'] || [],
  };
}

function transformQuoteForAPI(record: QuoteRecord) {
  return {
    id: record.id,
    quoteNumber: record.fields['Quote Number'],
    advertiserId: record.fields['Advertiser']?.[0] || null,
    totalAmount: record.fields['Total Amount'],
    discountRate: (record.fields['Discount Rate'] || 0) * 100, // Convert from decimal (0-1) to percentage (0-100) for frontend
    finalAmount: record.fields['Final Amount'] || record.fields['Total Amount'],
    status: record.fields['Status'],
    pdfUrl: record.fields['PDF URL'] || '',
    sentAt: record.fields['Sent At'] || null,
  };
}

function transformAdProductForAPI(record: AdProductRecord) {
  return {
    id: record.id,
    productName: record.fields['Product Name'],
    description: record.fields['Description'] || '',
    format: record.fields['Format'],
    dimensions: record.fields['Dimensions'] || '',
    position: record.fields['Position'] || '',
    unitPrice: record.fields['Unit Price'],
    status: record.fields['Status'],
  };
}

function transformQuoteItemForAPI(record: QuoteItemRecord) {
  return {
    id: record.id,
    quoteId: record.fields['Quote']?.[0] || null,
    adProductId: record.fields['Ad Product']?.[0] || null,
    quantity: record.fields['Quantity'],
    unitPrice: record.fields['Unit Price'],
    subtotal: record.fields['Subtotal'] || (record.fields['Quantity'] * record.fields['Unit Price']),
    duration: record.fields['Duration'] || null,
  };
}

function transformInvoiceForAPI(record: InvoiceRecord) {
  return {
    id: record.id,
    invoiceNumber: record.fields['Invoice Number'],
    quoteId: record.fields['Quote']?.[0] || null,
    advertiserId: record.fields['Advertiser']?.[0] || null,
    amount: record.fields['Amount'],
    status: record.fields['Status'],
    issueDate: record.fields['Issue Date'] || null,
    dueDate: record.fields['Due Date'] || null,
    paymentDate: record.fields['Payment Date'] || null,
    notes: record.fields['Notes'] || '',
  };
}

function transformCampaignForAPI(record: CampaignRecord) {
  return {
    id: record.id,
    campaignName: record.fields['Campaign Name'],
    advertiserId: record.fields['Advertiser']?.[0] || null,
    adProductIds: record.fields['Ad Products'] || [],
    startDate: record.fields['Start Date'],
    endDate: record.fields['End Date'],
    status: record.fields['Status'],
    pipelineStatus: record.fields['Pipeline Status'] || '문의중',
    utmCampaign: record.fields['UTM Campaign'] || '',
    googleCalendarId: record.fields['Google Calendar ID'] || '',
    creativeIds: record.fields['Creatives'] || [],
    reportIds: record.fields['Reports'] || [],
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Google OAuth 인증 활성화
  await setupAuth(app);

  // Development mode: auto-login endpoint
  if (!GOOGLE_AUTH_ENABLED) {
    app.post('/api/auth/dev-login', async (req, res) => {
      try {
        // Create or get development user
        const devUser = await createUser({
          name: 'Dev User',
          email: 'dev@venturesquare.net',
          googleUid: 'dev-user-123',
        });

        // Manually set user in session
        req.login(devUser, (err) => {
          if (err) {
            return res.status(500).json({ error: 'Login failed' });
          }
          res.json({
            id: devUser.id,
            name: devUser.fields['Name'],
            email: devUser.fields['Email'],
            role: devUser.fields['Role'],
            status: devUser.fields['Status'],
          });
        });
      } catch (error) {
        console.error('Dev login error:', error);
        res.status(500).json({ error: 'Dev login failed' });
      }
    });
  }

  // Google OAuth routes (only if OAuth is configured)
  if (GOOGLE_AUTH_ENABLED) {
    app.get('/api/auth/google', passport.authenticate('google', {
      accessType: 'offline',
      prompt: 'consent',
    }));

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login' }),
      (req, res) => {
        // Successful authentication, redirect to dashboard
        res.redirect('/');
      }
    );
  }

  // Get current user (no requireAuth - handle manually for dev mode)
  app.get('/api/auth/user', (req, res) => {
    // Development mode: return devMode flag if not authenticated
    if (!GOOGLE_AUTH_ENABLED && !req.user) {
      return res.json({ user: null, devMode: true });
    }

    // Production mode: check authentication
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        user: null,
        devMode: false
      });
    }

    const user = req.user as UserRecord;
    res.json({
      user: {
        id: user.id,
        name: user.fields['Name'],
        email: user.fields['Email'],
        role: user.fields['Role'],
        status: user.fields['Status'],
      },
      devMode: !GOOGLE_AUTH_ENABLED,
    });
  });

  // Logout (Passport 0.7 requires req.logOut with capital O)
  app.post('/api/auth/logout', (req, res) => {
    req.logOut((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Session destruction failed' });
        }
        res.json({ success: true });
      });
    });
  });

  // 이전 이메일 기반 인증 라우트는 비활성화됨
  /*
  // Public auth routes
  app.post("/api/auth/request-link", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      if (email !== ADMIN_EMAIL) {
        return res.status(403).json({ 
          error: "이 이메일 주소는 등록되지 않았습니다. 관리자에게 문의하세요." 
        });
      }

      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({ email });
      }

      // Development mode: auto-login without email
      if (process.env.NODE_ENV === 'development') {
        req.session.userId = user.id;
        req.session.email = user.email;
        
        return res.json({ 
          success: true, 
          autoLogin: true,
          message: "자동 로그인되었습니다." 
        });
      }

      // Production mode: send magic link
      try {
        const token = await createAuthToken(email);
        console.log('[AUTH] Created auth token for:', email);
        
        await sendMagicLink(email, token);
        console.log('[AUTH] Magic link sent successfully to:', email);

        res.json({ 
          success: true, 
          message: "인증 링크가 이메일로 발송되었습니다." 
        });
      } catch (emailError) {
        console.error('[AUTH] Error sending magic link:', emailError);
        throw emailError;
      }
    } catch (error) {
      console.error("[AUTH] Error requesting magic link:", error);
      const errorMessage = error instanceof Error ? error.message : "인증 링크 발송에 실패했습니다.";
      res.status(500).json({ 
        error: "인증 링크 발송에 실패했습니다.",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });

  app.get("/api/auth/verify", async (req, res) => {
    try {
      const { token } = z.object({ token: z.string() }).parse(req.query);
      
      const email = await verifyAuthToken(token);
      
      if (!email) {
        return res.status(401).json({ 
          error: "유효하지 않거나 만료된 토큰입니다." 
        });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
      }

      req.session.userId = user.id;
      req.session.email = user.email;

      res.json({ success: true, user });
    } catch (error) {
      console.error("Error verifying token:", error);
      res.status(500).json({ error: "인증에 실패했습니다." });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUserByEmail(req.session.email!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "로그아웃에 실패했습니다." });
      }
      res.json({ success: true });
    });
  });

  // Test endpoint to verify email sending (development only)
  app.post("/api/auth/test-email", async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "This endpoint is only available in development mode" });
    }

    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      console.log('[TEST] Testing email send to:', email);
      const token = await createAuthToken(email);
      console.log('[TEST] Token created, attempting to send email...');
      
      await sendMagicLink(email, token);
      console.log('[TEST] Email sent successfully!');

      res.json({ 
        success: true, 
        message: "테스트 이메일이 발송되었습니다. 메일함을 확인하세요.",
        token: token // Only for testing
      });
    } catch (error) {
      console.error("[TEST] Error sending test email:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        error: "테스트 이메일 발송 실패",
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });
  */

  // Agency routes - Airtable-based
  app.get("/api/agencies", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const records = await agenciesTable.getAllAgencies();
      const agencies = records.map(transformAgencyForAPI);
      res.json(agencies);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch agencies', details: errorMessage });
    }
  });

  app.get("/api/agencies/:id", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const recordId = req.params.id;
      const record = await agenciesTable.getAgencyById(recordId);
      
      if (!record) {
        return res.status(404).json({ error: "Agency not found" });
      }
      
      res.json(transformAgencyForAPI(record));
    } catch (error) {
      console.error('Error fetching agency:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch agency', details: errorMessage });
    }
  });

  app.post("/api/agencies", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        name: z.string().trim().min(1, "Agency name is required"),
        contactPerson: z.string().trim().min(1, "Contact person is required"),
        email: z.string().trim().email("Valid email is required"),
        phone: z.string().trim().min(1, "Phone is required"),
        businessRegistrationNumber: optionalString,
        notes: optionalString,
        status: z.enum(['Active', 'Inactive']).optional(),
      });
      
      const data = schema.parse(req.body);
      
      if (!data.name || !data.contactPerson || !data.email || !data.phone) {
        return res.status(400).json({ error: 'Required fields cannot be empty' });
      }
      
      const record = await agenciesTable.createAgency({
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        businessRegistrationNumber: data.businessRegistrationNumber,
        notes: data.notes,
        status: data.status || 'Active',
      });
      
      if (!record) {
        return res.status(500).json({ error: 'Failed to create agency in Airtable' });
      }
      
      res.json(transformAgencyForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error creating agency:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create agency', details: errorMessage });
    }
  });

  app.patch("/api/agencies/:id", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        name: z.string().trim().min(1).optional(),
        contactPerson: z.string().trim().min(1).optional(),
        email: z.string().trim().email().optional(),
        phone: z.string().trim().min(1).optional(),
        businessRegistrationNumber: optionalString,
        notes: optionalString,
        status: z.enum(['Active', 'Inactive']).optional(),
      });
      
      const data = schema.parse(req.body);
      const recordId = req.params.id;
      
      const record = await agenciesTable.updateAgency(recordId, {
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        businessRegistrationNumber: data.businessRegistrationNumber,
        notes: data.notes,
        status: data.status,
      });
      
      if (!record) {
        return res.status(404).json({ error: 'Agency not found' });
      }
      
      res.json(transformAgencyForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error updating agency:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to update agency', details: errorMessage });
    }
  });

  app.delete("/api/agencies/:id", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const recordId = req.params.id;
      
      if (!recordId) {
        return res.status(400).json({ error: 'Agency ID is required' });
      }
      
      const success = await agenciesTable.deleteAgency(recordId);
      
      if (!success) {
        return res.status(404).json({ error: 'Agency not found or delete failed' });
      }
      
      res.json({ success: true, message: 'Agency deleted successfully (status set to Inactive)' });
    } catch (error) {
      console.error('Error deleting agency:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to delete agency', details: errorMessage });
    }
  });

  // Advertiser routes - Airtable-based
  app.get("/api/advertisers", async (req, res) => {
    try {
      // Check if Airtable is configured
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const records = await advertisersTable.getAllAdvertisers();
      const advertisers = records.map(transformAdvertiserForAPI);
      res.json(advertisers);
    } catch (error) {
      console.error('Error fetching advertisers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch advertisers', details: errorMessage });
    }
  });

  app.get("/api/advertisers/:id", async (req, res) => {
    try {
      // Check if Airtable is configured
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const recordId = req.params.id;
      const record = await advertisersTable.getAdvertiserById(recordId);
      
      if (!record) {
        return res.status(404).json({ error: "Advertiser not found" });
      }
      
      res.json(transformAdvertiserForAPI(record));
    } catch (error) {
      console.error('Error fetching advertiser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch advertiser', details: errorMessage });
    }
  });

  app.post("/api/advertisers", requireAuth, async (req, res) => {
    try {
      // Check if Airtable is configured
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        companyName: z.string().trim().min(1, "Company name is required"),
        contactPerson: z.string().trim().min(1, "Contact person is required"),
        contactPersonType: z.enum(['Advertiser', 'Agency']),
        email: z.string().trim().email("Valid email is required"),
        phone: z.string().trim().min(1, "Phone is required"),
        businessNumber: optionalString,
        businessRegistrationNumber: optionalString,
        bankAccountNumber: optionalString,
        adMaterials: optionalString,
        agencyId: optionalString,
        industry: optionalString,
        status: z.enum(['Lead', 'Active', 'Inactive']).optional(),
      });
      
      const data = schema.parse(req.body);
      
      if (!data.companyName || !data.contactPerson || !data.email || !data.phone) {
        return res.status(400).json({ error: 'Required fields cannot be empty' });
      }
      
      const record = await advertisersTable.createAdvertiser({
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        contactPersonType: data.contactPersonType,
        email: data.email,
        phone: data.phone,
        businessNumber: data.businessNumber,
        businessRegistrationNumber: data.businessRegistrationNumber,
        bankAccountNumber: data.bankAccountNumber,
        adMaterials: data.adMaterials,
        agencyId: data.agencyId,
        industry: data.industry,
        status: data.status || 'Lead',
      });
      
      if (!record) {
        return res.status(500).json({ error: 'Failed to create advertiser in Airtable' });
      }
      
      res.json(transformAdvertiserForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[Advertiser POST] Zod validation error:', JSON.stringify(error.errors, null, 2));
        console.error('[Advertiser POST] Request body:', JSON.stringify(req.body, null, 2));
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error creating advertiser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create advertiser', details: errorMessage });
    }
  });

  app.patch("/api/advertisers/:id", requireAuth, async (req, res) => {
    try {
      // Check if Airtable is configured
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        companyName: z.string().trim().min(1).optional(),
        contactPerson: z.string().trim().min(1).optional(),
        contactPersonType: z.enum(['Advertiser', 'Agency']).optional(),
        email: z.string().trim().email().optional(),
        phone: z.string().trim().min(1).optional(),
        businessNumber: optionalString,
        businessRegistrationNumber: optionalString,
        bankAccountNumber: optionalString,
        adMaterials: optionalString,
        agencyId: optionalString,
        industry: optionalString,
        status: z.enum(['Lead', 'Active', 'Inactive']).optional(),
      });
      
      const data = schema.parse(req.body);
      const recordId = req.params.id;
      
      const record = await advertisersTable.updateAdvertiser(recordId, {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        contactPersonType: data.contactPersonType,
        email: data.email,
        phone: data.phone,
        businessNumber: data.businessNumber,
        businessRegistrationNumber: data.businessRegistrationNumber,
        bankAccountNumber: data.bankAccountNumber,
        adMaterials: data.adMaterials,
        agencyId: data.agencyId,
        industry: data.industry,
        status: data.status,
      });
      
      if (!record) {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
      
      res.json(transformAdvertiserForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      
      console.error('Error updating advertiser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Map helper errors to proper HTTP status codes
      if (errorMessage.includes('not found') || errorMessage.includes('update failed')) {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }
      if (errorMessage.includes('No fields to update')) {
        return res.status(400).json({ error: 'No fields provided for update' });
      }
      
      res.status(500).json({ error: 'Failed to update advertiser', details: errorMessage });
    }
  });

  app.delete("/api/advertisers/:id", requireAuth, async (req, res) => {
    try {
      const recordId = req.params.id;
      
      if (!recordId) {
        return res.status(400).json({ error: 'Advertiser ID is required' });
      }
      
      const success = await advertisersTable.deleteAdvertiser(recordId);
      
      if (!success) {
        return res.status(404).json({ error: 'Advertiser not found or deletion failed' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting advertiser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }
      
      res.status(500).json({ error: 'Failed to delete advertiser', details: errorMessage });
    }
  });

  // Campaign routes - Airtable-based
  // NOTE: Specific routes must be defined before dynamic routes to avoid path matching conflicts
  
  app.get("/api/campaigns", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const records = await campaignsTable.getAllCampaigns();
      const campaigns = records.map(transformCampaignForAPI);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch campaigns', details: errorMessage });
    }
  });

  // Get pipeline status counts for dashboard
  app.get("/api/campaigns/pipeline-counts", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const counts = await campaignsTable.getPipelineStatusCounts();
      res.json(counts);
    } catch (error) {
      console.error('Error fetching pipeline status counts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch pipeline status counts', details: errorMessage });
    }
  });

  app.get("/api/campaigns/advertiser/:advertiserId", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const campaigns = await campaignsTable.getCampaignsByAdvertiser(req.params.advertiserId);
      res.json(campaigns.map(transformCampaignForAPI));
    } catch (error) {
      console.error('Error fetching campaigns by advertiser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch campaigns', details: errorMessage });
    }
  });

  app.get("/api/campaigns/status/:status", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const status = req.params.status as 'Planning' | 'Active' | 'Completed' | 'Cancelled';
      const campaigns = await campaignsTable.getCampaignsByStatus(status);
      res.json(campaigns.map(transformCampaignForAPI));
    } catch (error) {
      console.error('Error fetching campaigns by status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch campaigns', details: errorMessage });
    }
  });

  // Get campaigns by pipeline status
  app.get("/api/campaigns/pipeline/:status", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const pipelineStatus = decodeURIComponent(req.params.status) as any;
      const campaigns = await campaignsTable.getCampaignsByPipelineStatus(pipelineStatus);
      res.json(campaigns.map(transformCampaignForAPI));
    } catch (error) {
      console.error('Error fetching campaigns by pipeline status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch campaigns', details: errorMessage });
    }
  });

  // Get campaign by ID - MUST be last among GET routes to avoid matching specific paths
  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const campaign = await campaignsTable.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json(transformCampaignForAPI(campaign));
    } catch (error) {
      console.error('Error fetching campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch campaign', details: errorMessage });
    }
  });

  app.post("/api/campaigns", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const schema = z.object({
        campaignName: z.string().min(1),
        advertiserId: z.string().min(1),
        startDate: z.string(),
        endDate: z.string(),
        status: z.enum(['Planning', 'Active', 'Completed', 'Cancelled']).optional(),
        pipelineStatus: z.enum(['문의중', '견적제시', '일정조율중', '부킹확정', '집행중', '결과보고', '세금계산서 발행 및 대금 청구', '매출 입금']).optional(),
        adProductIds: z.array(z.string()).optional(),
        utmCampaign: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const campaign = await campaignsTable.createCampaign(data);
      
      // Auto-sync to Google Calendar
      try {
        // Get advertiser info
        let advertiser: AdvertiserRecord | null = null;
        if (campaign.fields['Advertiser']?.length > 0) {
          advertiser = await advertisersTable.getAdvertiserById(campaign.fields['Advertiser'][0]);
        }

        // Get ad products info
        const adProducts: AdProductRecord[] = [];
        if (campaign.fields['Ad Products']?.length > 0) {
          for (const productId of campaign.fields['Ad Products']) {
            const product = await adProductsTable.getAdProductById(productId);
            if (product) {
              adProducts.push(product);
            }
          }
        }

        // Create calendar event
        const calendarEvent = await googleCalendarService.createCampaignEvent(
          campaign,
          advertiser,
          adProducts
        );

        // Update campaign with calendar ID
        await campaignsTable.updateCampaign(campaign.id, {
          googleCalendarId: calendarEvent.id,
        });
        
        console.log(`✅ Campaign ${campaign.id} synced to Google Calendar: ${calendarEvent.id}`);
      } catch (calendarError) {
        console.warn('⚠️ Failed to sync campaign to Google Calendar:', calendarError);
        // Don't fail the campaign creation if calendar sync fails
      }
      
      res.json(transformCampaignForAPI(campaign));
    } catch (error) {
      console.error('Error creating campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }

      res.status(500).json({ error: 'Failed to create campaign', details: errorMessage });
    }
  });

  app.patch("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const schema = z.object({
        campaignName: z.string().min(1).optional(),
        advertiserId: z.string().min(1).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(['Planning', 'Active', 'Completed', 'Cancelled']).optional(),
        pipelineStatus: z.enum(['문의중', '견적제시', '일정조율중', '부킹확정', '집행중', '결과보고', '세금계산서 발행 및 대금 청구', '매출 입금']).optional(),
        adProductIds: z.array(z.string()).optional(),
        utmCampaign: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const campaign = await campaignsTable.updateCampaign(req.params.id, data);
      
      // Auto-sync to Google Calendar if already synced
      if (campaign.fields['Google Calendar ID']) {
        try {
          // Get advertiser info
          let advertiser: AdvertiserRecord | null = null;
          if (campaign.fields['Advertiser']?.length > 0) {
            advertiser = await advertisersTable.getAdvertiserById(campaign.fields['Advertiser'][0]);
          }

          // Get ad products info
          const adProducts: AdProductRecord[] = [];
          if (campaign.fields['Ad Products']?.length > 0) {
            for (const productId of campaign.fields['Ad Products']) {
              const product = await adProductsTable.getAdProductById(productId);
              if (product) {
                adProducts.push(product);
              }
            }
          }

          // Update calendar event
          await googleCalendarService.updateCampaignEvent(
            campaign.fields['Google Calendar ID'],
            campaign,
            advertiser,
            adProducts
          );
          
          console.log(`✅ Campaign ${campaign.id} updated in Google Calendar`);
        } catch (calendarError) {
          console.warn('⚠️ Failed to update campaign in Google Calendar:', calendarError);
          // Don't fail the campaign update if calendar sync fails
        }
      }
      
      res.json(transformCampaignForAPI(campaign));
    } catch (error) {
      console.error('Error updating campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }

      res.status(500).json({ error: 'Failed to update campaign', details: errorMessage });
    }
  });

  app.delete("/api/campaigns/:id", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      // Get campaign first to check for Google Calendar ID
      const campaign = await campaignsTable.getCampaignById(req.params.id);
      
      const success = await campaignsTable.deleteCampaign(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Campaign not found or deletion failed' });
      }

      // Auto-delete from Google Calendar if it was synced
      if (campaign?.fields['Google Calendar ID']) {
        try {
          await googleCalendarService.deleteCampaignEvent(
            campaign.fields['Google Calendar ID']
          );
          console.log(`✅ Campaign ${campaign.id} deleted from Google Calendar`);
        } catch (calendarError) {
          console.warn('⚠️ Failed to delete campaign from Google Calendar:', calendarError);
          // Don't fail the campaign deletion if calendar deletion fails
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }

      res.status(500).json({ error: 'Failed to delete campaign', details: errorMessage });
    }
  });

  // Get campaign comprehensive details
  app.get("/api/campaigns/:id/details", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const campaign = await campaignsTable.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Get advertiser info
      let advertiser: AdvertiserRecord | null = null;
      if (campaign.fields['Advertiser']?.length > 0) {
        advertiser = await advertisersTable.getAdvertiserById(campaign.fields['Advertiser'][0]);
      }

      // Get ad products info
      const adProducts: AdProductRecord[] = [];
      if (campaign.fields['Ad Products']?.length > 0) {
        for (const productId of campaign.fields['Ad Products']) {
          const product = await adProductsTable.getAdProductById(productId);
          if (product) {
            adProducts.push(product);
          }
        }
      }

      // Format comprehensive info
      const comprehensiveInfo = googleCalendarService.formatCampaignDescription(
        campaign,
        advertiser,
        adProducts
      );

      res.json({
        campaign: transformCampaignForAPI(campaign),
        advertiser: advertiser ? transformAdvertiserForAPI(advertiser) : null,
        adProducts: adProducts.map(transformAdProductForAPI),
        comprehensiveInfo,
      });
    } catch (error) {
      console.error('Error getting campaign details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to get campaign details', details: errorMessage });
    }
  });

  // Add campaign to Google Calendar
  app.post("/api/campaigns/:id/add-to-calendar", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }

      const campaign = await campaignsTable.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Check if already added to calendar
      if (campaign.fields['Google Calendar ID']) {
        return res.status(400).json({ 
          error: '이미 캘린더에 등록된 캠페인입니다.',
          calendarId: campaign.fields['Google Calendar ID']
        });
      }

      // Get advertiser info
      let advertiser: AdvertiserRecord | null = null;
      if (campaign.fields['Advertiser']?.length > 0) {
        advertiser = await advertisersTable.getAdvertiserById(campaign.fields['Advertiser'][0]);
      }

      // Get ad products info
      const adProducts: AdProductRecord[] = [];
      if (campaign.fields['Ad Products']?.length > 0) {
        for (const productId of campaign.fields['Ad Products']) {
          const product = await adProductsTable.getAdProductById(productId);
          if (product) {
            adProducts.push(product);
          }
        }
      }

      // Create calendar event
      const calendarEvent = await googleCalendarService.createCampaignEvent(
        campaign,
        advertiser,
        adProducts,
        'primary'
      );

      // Update campaign with calendar ID
      const updatedCampaign = await campaignsTable.updateCampaign(req.params.id, {
        googleCalendarId: calendarEvent.id,
      });

      res.json({
        success: true,
        calendarEvent: {
          id: calendarEvent.id,
          summary: calendarEvent.summary,
          htmlLink: calendarEvent.htmlLink,
        },
        campaign: transformCampaignForAPI(updatedCampaign),
      });
    } catch (error) {
      console.error('Error adding campaign to calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not connected') || errorMessage.includes('Calendar')) {
        return res.status(503).json({ 
          error: 'Google Calendar 연결이 필요합니다.',
          details: errorMessage 
        });
      }

      res.status(500).json({ error: 'Failed to add campaign to calendar', details: errorMessage });
    }
  });

  // Communication Logs routes - Airtable-based
  app.get("/api/advertisers/:id/communication-logs", async (req, res) => {
    try {
      // Check if Airtable is configured
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const advertiserId = req.params.id;
      const logs = await communicationLogsTable.getCommunicationLogsByAdvertiser(advertiserId);
      
      const transformed = logs.map((log: any) => ({
        id: log.id,
        type: log.fields['Type'],
        subject: log.fields['Subject'] || '',
        content: log.fields['Content'],
        status: log.fields['Status'],
        sentAt: log.fields['Sent At'],
        externalId: log.fields['External ID'] || '',
      }));
      
      res.json(transformed);
    } catch (error) {
      console.error('Error fetching communication logs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch communication logs', details: errorMessage });
    }
  });

  app.post("/api/communication-logs", requireAuth, async (req, res) => {
    try {
      // Check if Airtable is configured
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        advertiserId: z.string().trim().min(1, "Advertiser ID is required"),
        type: z.enum(['Email', 'SMS', 'KakaoTalk', 'Inbound Email']),
        subject: z.string().trim().optional(),
        content: z.string().trim().min(1, "Content is required"),
        status: z.enum(['Sent', 'Failed', 'Delivered', 'Read']).optional(),
        externalId: z.string().trim().optional(),
      });
      
      const data = schema.parse(req.body);
      
      if (!data.advertiserId || !data.content) {
        return res.status(400).json({ error: 'Required fields cannot be empty' });
      }
      
      const log = await communicationLogsTable.createCommunicationLog({
        advertiserId: data.advertiserId,
        type: data.type,
        subject: data.subject,
        content: data.content,
        status: data.status || 'Sent',
        externalId: data.externalId,
      });
      
      if (!log) {
        return res.status(500).json({ error: 'Failed to create communication log in Airtable' });
      }
      
      const transformed = {
        id: log.id,
        type: log.fields['Type'],
        subject: log.fields['Subject'] || '',
        content: log.fields['Content'],
        status: log.fields['Status'],
        sentAt: log.fields['Sent At'],
        externalId: log.fields['External ID'] || '',
      };
      
      res.json(transformed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error creating communication log:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create communication log', details: errorMessage });
    }
  });

  // Ad Products routes - Airtable-based
  app.get("/api/ad-products", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }
      
      const records = await adProductsTable.getActiveAdProducts();
      const products = records.map(transformAdProductForAPI);
      res.json(products);
    } catch (error) {
      console.error('Error fetching ad products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch ad products', details: errorMessage });
    }
  });

  app.get("/api/ad-products/:id", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }
      
      const recordId = req.params.id;
      const record = await adProductsTable.getAdProductById(recordId);
      
      if (!record) {
        return res.status(404).json({ error: "Ad product not found" });
      }
      
      res.json(transformAdProductForAPI(record));
    } catch (error) {
      console.error('Error fetching ad product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch ad product', details: errorMessage });
    }
  });

  // Quotes routes - Airtable-based
  app.get("/api/quotes", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const records = await quotesTable.getAllQuotes();
      const quotes = records.map(transformQuoteForAPI);
      res.json(quotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch quotes', details: errorMessage });
    }
  });

  app.get("/api/quotes/:id", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const recordId = req.params.id;
      const record = await quotesTable.getQuoteById(recordId);
      
      if (!record) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      res.json(transformQuoteForAPI(record));
    } catch (error) {
      console.error('Error fetching quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch quote', details: errorMessage });
    }
  });

  app.get("/api/advertisers/:advertiserId/quotes", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const advertiserId = req.params.advertiserId;
      const records = await quotesTable.getQuotesByAdvertiser(advertiserId);
      const quotes = records.map(transformQuoteForAPI);
      res.json(quotes);
    } catch (error) {
      console.error('Error fetching quotes by advertiser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch quotes', details: errorMessage });
    }
  });

  app.post("/api/quotes", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        advertiserId: z.string().trim().min(1, "Advertiser ID is required"),
        totalAmount: z.number().min(0, "Total amount must be 0 or greater"),
        discountRate: z.number().min(0).max(100).optional(),
        finalAmount: z.number().min(0).optional(),
        status: z.enum(['Draft', 'Sent', 'Approved', 'Rejected']).optional(),
        pdfUrl: z.string().trim().url().optional().or(z.literal('')),
      });
      
      const data = schema.parse(req.body);
      
      // Convert discount rate from percentage (0-100) to decimal (0-1)
      const discountRateDecimal = data.discountRate !== undefined ? data.discountRate / 100 : undefined;
      
      const record = await quotesTable.createQuote({
        advertiserId: data.advertiserId,
        totalAmount: data.totalAmount,
        discountRate: discountRateDecimal,
        finalAmount: data.finalAmount,
        status: data.status || 'Draft',
        pdfUrl: data.pdfUrl,
      });
      
      if (!record) {
        return res.status(500).json({ error: 'Failed to create quote in Airtable' });
      }
      
      res.json(transformQuoteForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error creating quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create quote', details: errorMessage });
    }
  });

  app.patch("/api/quotes/:id", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        totalAmount: z.number().min(0).optional(),
        discountRate: z.number().min(0).max(100).optional(),
        status: z.enum(['Draft', 'Sent', 'Approved', 'Rejected']).optional(),
        pdfUrl: z.string().trim().url().optional().or(z.literal('')),
        sentAt: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      const recordId = req.params.id;
      
      // Convert discount rate from percentage (0-100) to decimal (0-1)
      const discountRateDecimal = data.discountRate !== undefined ? data.discountRate / 100 : undefined;
      
      const record = await quotesTable.updateQuote(recordId, {
        totalAmount: data.totalAmount,
        discountRate: discountRateDecimal,
        status: data.status,
        pdfUrl: data.pdfUrl,
        sentAt: data.sentAt,
      });
      
      if (!record) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      res.json(transformQuoteForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      
      console.error('Error updating quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('update failed')) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }
      if (errorMessage.includes('No fields to update')) {
        return res.status(400).json({ error: 'No fields provided for update' });
      }
      
      res.status(500).json({ error: 'Failed to update quote', details: errorMessage });
    }
  });

  app.delete("/api/quotes/:id", requireAuth, async (req, res) => {
    try {
      const recordId = req.params.id;
      
      if (!recordId) {
        return res.status(400).json({ error: 'Quote ID is required' });
      }
      
      const success = await quotesTable.deleteQuote(recordId);
      
      if (!success) {
        return res.status(404).json({ error: 'Quote not found or deletion failed' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }
      
      res.status(500).json({ error: 'Failed to delete quote', details: errorMessage });
    }
  });

  app.post("/api/quotes/:id/send", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const recordId = req.params.id;
      const record = await quotesTable.sendQuote(recordId);
      
      if (!record) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      res.json(transformQuoteForAPI(record));
    } catch (error) {
      console.error('Error sending quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      res.status(500).json({ error: 'Failed to send quote', details: errorMessage });
    }
  });

  // Send quote via email
  app.post("/api/quotes/:id/send-email", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }
      
      const quoteId = req.params.id;
      const { recipientEmail, message } = req.body;
      
      // Fetch quote details
      const quote = await quotesTable.getQuoteById(quoteId);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      // Fetch advertiser details
      const advertiserId = quote.fields['Advertiser']?.[0];
      if (!advertiserId) {
        return res.status(400).json({ error: 'Quote has no advertiser' });
      }
      
      const advertiser = await advertisersTable.getAdvertiserById(advertiserId);
      if (!advertiser) {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
      
      const email = recipientEmail || advertiser.fields['Email'];
      if (!email) {
        return res.status(400).json({ error: 'No email address available' });
      }
      
      // Send email via Resend
      const { client, fromEmail } = await getUncachableResendClient();
      const quoteNumber = quote.fields['Quote Number'] || quoteId;
      const totalAmount = quote.fields['Total Amount'] || 0;
      const finalAmount = quote.fields['Final Amount'] || totalAmount;
      
      await client.emails.send({
        from: fromEmail,
        to: email,
        subject: `[벤처스퀘어] 견적서 #${quoteNumber}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">견적서</h2>
            <p style="color: #666; margin-bottom: 20px;">안녕하세요, ${advertiser.fields['Company Name']}님</p>
            ${message ? `<p style="color: #666; margin-bottom: 20px;">${message}</p>` : ''}
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>견적서 번호:</strong> #${quoteNumber}</p>
              <p style="margin: 10px 0;"><strong>최종 금액:</strong> ${finalAmount.toLocaleString('ko-KR')}원</p>
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">문의사항이 있으시면 언제든지 연락주세요.</p>
          </div>
        `,
      });
      
      // Update quote status to Sent
      await quotesTable.sendQuote(quoteId);
      
      // Log communication
      await communicationLogsTable.createCommunicationLog({
        advertiserId,
        type: 'Email',
        subject: `견적서 #${quoteNumber}`,
        content: message || `견적서가 이메일로 발송되었습니다.`,
        status: 'Sent',
      });
      
      res.json({ success: true, message: '견적서가 이메일로 발송되었습니다.' });
    } catch (error) {
      console.error('Error sending quote via email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to send quote via email', details: errorMessage });
    }
  });
  
  // Send quote via SMS
  app.post("/api/quotes/:id/send-sms", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }
      
      const quoteId = req.params.id;
      const { recipientPhone, message } = req.body;
      
      // Fetch quote details
      const quote = await quotesTable.getQuoteById(quoteId);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      // Fetch advertiser details
      const advertiserId = quote.fields['Advertiser']?.[0];
      if (!advertiserId) {
        return res.status(400).json({ error: 'Quote has no advertiser' });
      }
      
      const advertiser = await advertisersTable.getAdvertiserById(advertiserId);
      if (!advertiser) {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
      
      const phone = recipientPhone || advertiser.fields['Phone'];
      if (!phone) {
        return res.status(400).json({ error: 'No phone number available' });
      }
      
      // Send SMS via Solapi
      const quoteNumber = quote.fields['Quote Number'] || quoteId;
      const finalAmount = quote.fields['Final Amount'] || quote.fields['Total Amount'] || 0;
      
      const smsText = message || `[벤처스퀘어] 견적서 #${quoteNumber}이(가) 발송되었습니다. 최종 금액: ${finalAmount.toLocaleString('ko-KR')}원`;
      
      await solapiService.sendSMS({
        to: phone,
        text: smsText,
      });
      
      // Update quote status to Sent
      await quotesTable.sendQuote(quoteId);
      
      // Log communication
      await communicationLogsTable.createCommunicationLog({
        advertiserId,
        type: 'SMS',
        content: smsText,
        status: 'Sent',
      });
      
      res.json({ success: true, message: '견적서가 SMS로 발송되었습니다.' });
    } catch (error) {
      console.error('Error sending quote via SMS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to send quote via SMS', details: errorMessage });
    }
  });
  
  // Send quote via KakaoTalk
  app.post("/api/quotes/:id/send-kakao", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }
      
      const quoteId = req.params.id;
      const { recipientPhone, message } = req.body;
      
      // Fetch quote details
      const quote = await quotesTable.getQuoteById(quoteId);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      // Fetch advertiser details
      const advertiserId = quote.fields['Advertiser']?.[0];
      if (!advertiserId) {
        return res.status(400).json({ error: 'Quote has no advertiser' });
      }
      
      const advertiser = await advertisersTable.getAdvertiserById(advertiserId);
      if (!advertiser) {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
      
      const phone = recipientPhone || advertiser.fields['Phone'];
      if (!phone) {
        return res.status(400).json({ error: 'No phone number available' });
      }
      
      // Send KakaoTalk via Solapi (using SMS fallback)
      const quoteNumber = quote.fields['Quote Number'] || quoteId;
      const finalAmount = quote.fields['Final Amount'] || quote.fields['Total Amount'] || 0;
      
      const kakaoText = message || `[벤처스퀘어] 견적서 #${quoteNumber}이(가) 발송되었습니다. 최종 금액: ${finalAmount.toLocaleString('ko-KR')}원`;
      
      // Note: For actual KakaoTalk Alimtalk, you need templateId and pfId
      // For now, using SMS as fallback
      await solapiService.sendSMS({
        to: phone,
        text: kakaoText,
      });
      
      // Update quote status to Sent
      await quotesTable.sendQuote(quoteId);
      
      // Log communication
      await communicationLogsTable.createCommunicationLog({
        advertiserId,
        type: 'KakaoTalk',
        content: kakaoText,
        status: 'Sent',
      });
      
      res.json({ success: true, message: '견적서가 카카오톡으로 발송되었습니다.' });
    } catch (error) {
      console.error('Error sending quote via KakaoTalk:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to send quote via KakaoTalk', details: errorMessage });
    }
  });

  app.post("/api/quotes/:id/approve", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const recordId = req.params.id;
      const record = await quotesTable.approveQuote(recordId);
      
      if (!record) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      res.json(transformQuoteForAPI(record));
    } catch (error) {
      console.error('Error approving quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      res.status(500).json({ error: 'Failed to approve quote', details: errorMessage });
    }
  });

  // Quote Items routes - Airtable-based
  app.get("/api/quotes/:quoteId/items", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const quoteId = req.params.quoteId;
      const records = await quoteItemsTable.getQuoteItemsByQuote(quoteId);
      const items = records.map(transformQuoteItemForAPI);
      res.json(items);
    } catch (error) {
      console.error('Error fetching quote items:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch quote items', details: errorMessage });
    }
  });

  // Get quote items by quote ID (query parameter)
  app.get("/api/quote-items", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured' });
      }
      
      const quoteId = req.query.quoteId as string;
      
      if (!quoteId) {
        return res.status(400).json({ error: 'quoteId query parameter is required' });
      }
      
      const records = await quoteItemsTable.getQuoteItemsByQuote(quoteId);
      const items = records.map(transformQuoteItemForAPI);
      res.json(items);
    } catch (error) {
      console.error('Error fetching quote items by quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch quote items', details: errorMessage });
    }
  });

  // Get single quote item by ID
  app.get("/api/quote-items/:id", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const recordId = req.params.id;
      const record = await quoteItemsTable.getQuoteItemById(recordId);
      
      if (!record) {
        return res.status(404).json({ error: "Quote item not found" });
      }
      
      res.json(transformQuoteItemForAPI(record));
    } catch (error) {
      console.error('Error fetching quote item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch quote item', details: errorMessage });
    }
  });

  app.post("/api/quote-items", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        quoteId: z.string().trim().min(1, "Quote ID is required"),
        adProductId: z.string().trim().min(1, "Ad Product ID is required"),
        quantity: z.number().int().positive("Quantity must be positive"),
        unitPrice: z.number().min(0, "Unit price cannot be negative"),
        subtotal: z.number().min(0).optional(),
        duration: z.number().int().positive().optional(),
      });
      
      const data = schema.parse(req.body);
      
      const record = await quoteItemsTable.createQuoteItem({
        quoteId: data.quoteId,
        adProductId: data.adProductId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        subtotal: data.subtotal,
        duration: data.duration,
      });
      
      if (!record) {
        return res.status(500).json({ error: 'Failed to create quote item in Airtable' });
      }
      
      res.json(transformQuoteItemForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error creating quote item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create quote item', details: errorMessage });
    }
  });

  app.post("/api/quote-items/bulk", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        quoteId: z.string().trim().min(1, "Quote ID is required"),
        items: z.array(z.object({
          // Accept both pricingId (from new UI) and adProductId (for backward compatibility)
          pricingId: z.string().trim().min(1).optional(),
          adProductId: z.string().trim().min(1).optional(),
          quantity: z.number().int().positive(),
          unitPrice: z.number().min(0),
          subtotal: z.number().min(0).optional(),
          duration: z.number().int().positive().optional(),
        }).refine(data => data.pricingId || data.adProductId, {
          message: "Either pricingId or adProductId is required"
        })).min(1, "At least one item is required"),
      });
      
      const data = schema.parse(req.body);
      
      // Map pricingId to adProductId for Airtable compatibility
      const itemsWithQuoteId = data.items.map(item => ({
        quoteId: data.quoteId,
        adProductId: item.pricingId || item.adProductId!,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        duration: item.duration,
      }));
      
      const records = await quoteItemsTable.bulkCreateQuoteItems(itemsWithQuoteId);
      const items = records.map(transformQuoteItemForAPI);
      res.json(items);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error bulk creating quote items:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to bulk create quote items', details: errorMessage });
    }
  });

  app.patch("/api/quote-items/:id", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        adProductId: z.string().trim().min(1).optional(),
        quantity: z.number().int().positive().optional(),
        unitPrice: z.number().min(0).optional(),
        duration: z.number().int().positive().optional(),
      });
      
      const data = schema.parse(req.body);
      const recordId = req.params.id;
      
      const record = await quoteItemsTable.updateQuoteItem(recordId, {
        adProductId: data.adProductId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        duration: data.duration,
      });
      
      if (!record) {
        return res.status(404).json({ error: 'Quote item not found' });
      }
      
      res.json(transformQuoteItemForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      
      console.error('Error updating quote item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('update failed')) {
        return res.status(404).json({ error: 'Quote item not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }
      
      res.status(500).json({ error: 'Failed to update quote item', details: errorMessage });
    }
  });

  app.delete("/api/quote-items/:id", requireAuth, async (req, res) => {
    try {
      const recordId = req.params.id;
      
      if (!recordId) {
        return res.status(400).json({ error: 'Quote item ID is required' });
      }
      
      const success = await quoteItemsTable.deleteQuoteItem(recordId);
      
      if (!success) {
        return res.status(404).json({ error: 'Quote item not found or deletion failed' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting quote item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Quote item not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }
      
      res.status(500).json({ error: 'Failed to delete quote item', details: errorMessage });
    }
  });

  // Quote sending routes
  app.post("/api/quotes/:id/send-email", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().trim().email("Valid email address is required"),
        message: z.string().trim().optional(),
      });
      
      const data = schema.parse(req.body);
      const quoteId = req.params.id;
      
      // Get quote from Airtable
      const quote = await quotesTable.getQuoteById(quoteId);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      // Get advertiser from Airtable
      const advertiserIds = quote.fields['Advertiser'];
      if (!advertiserIds || advertiserIds.length === 0) {
        return res.status(400).json({ error: 'Quote has no advertiser' });
      }
      
      const advertiser = await advertisersTable.getAdvertiserById(advertiserIds[0]);
      if (!advertiser) {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
      
      // Send email via Resend
      const { client, fromEmail } = await getUncachableResendClient();
      
      const quoteNumber = quote.fields['Quote Number'] || 'N/A';
      const finalAmount = quote.fields['Final Amount'] || 0;
      const advertiserName = advertiser.fields['Name'] || '고객님';
      const customMessage = data.message ? `\n\n${data.message}\n\n` : '';
      
      await client.emails.send({
        from: fromEmail,
        to: data.email,
        subject: `[벤처스퀘어] 견적서 발송 - ${quoteNumber}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">견적서 발송</h2>
            <p style="color: #666;">안녕하세요, ${advertiserName}님</p>
            <p style="color: #666;">요청하신 광고 견적서를 보내드립니다.</p>
            ${customMessage ? `<p style="color: #666; white-space: pre-wrap;">${customMessage}</p>` : ''}
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>견적번호:</strong> ${quoteNumber}</p>
              <p style="margin: 5px 0;"><strong>견적금액:</strong> ${finalAmount.toLocaleString()}원</p>
            </div>
            <p style="color: #666;">궁금하신 사항이 있으시면 언제든지 연락 주시기 바랍니다.</p>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              이 이메일은 벤처스퀘어 광고 관리 시스템에서 발송되었습니다.
            </p>
          </div>
        `,
      });
      
      // Update quote status to Sent
      await quotesTable.updateQuote(quoteId, { status: 'Sent' });
      
      // Log to communication logs
      await communicationLogsTable.createCommunicationLog({
        advertiserId: advertiserIds[0],
        type: 'Email',
        subject: `[벤처스퀘어] 견적서 발송 - ${quoteNumber}`,
        content: `견적서 이메일 발송 (견적번호: ${quoteNumber}, 금액: ${finalAmount.toLocaleString()}원)${data.message ? `\n\n추가 메시지:\n${data.message}` : ''}`,
        status: 'Sent',
      });
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error sending quote email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to send quote email', details: errorMessage });
    }
  });

  app.post("/api/quotes/:id/send-sms", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        phone: z.string().trim().min(1, "Phone number is required"),
        message: z.string().trim().optional(),
      });
      
      const data = schema.parse(req.body);
      const quoteId = req.params.id;
      
      // Get quote from Airtable
      const quote = await quotesTable.getQuoteById(quoteId);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      // Get advertiser from Airtable
      const advertiserIds = quote.fields['Advertiser'];
      if (!advertiserIds || advertiserIds.length === 0) {
        return res.status(400).json({ error: 'Quote has no advertiser' });
      }
      
      const advertiser = await advertisersTable.getAdvertiserById(advertiserIds[0]);
      if (!advertiser) {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
      
      // Send SMS via Solapi
      const quoteNumber = quote.fields['Quote Number'] || 'N/A';
      const finalAmount = quote.fields['Final Amount'] || 0;
      const advertiserName = advertiser.fields['Name'] || '고객님';
      const customMessage = data.message ? `\n\n${data.message}` : '';
      
      const smsText = `[벤처스퀘어] 안녕하세요, ${advertiserName}님. 요청하신 광고 견적서를 보내드립니다.\n\n견적번호: ${quoteNumber}\n견적금액: ${finalAmount.toLocaleString()}원${customMessage}`;
      
      const result = await solapiService.sendSMS({
        to: data.phone,
        text: smsText,
      });
      
      // Update quote status to Sent
      await quotesTable.updateQuote(quoteId, { status: 'Sent' });
      
      // Log to communication logs
      await communicationLogsTable.createCommunicationLog({
        advertiserId: advertiserIds[0],
        type: 'SMS',
        content: smsText,
        status: 'Sent',
        externalId: result.groupId || result.messageId,
      });
      
      res.json({ success: true, result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      if (error instanceof SolapiServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Error sending quote SMS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to send quote SMS', details: errorMessage });
    }
  });

  app.post("/api/quotes/:id/send-kakao", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        phone: z.string().trim().min(1, "Phone number is required"),
        message: z.string().trim().optional(),
      });
      
      const data = schema.parse(req.body);
      const quoteId = req.params.id;
      
      // Get quote from Airtable
      const quote = await quotesTable.getQuoteById(quoteId);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      // Get advertiser from Airtable
      const advertiserIds = quote.fields['Advertiser'];
      if (!advertiserIds || advertiserIds.length === 0) {
        return res.status(400).json({ error: 'Quote has no advertiser' });
      }
      
      const advertiser = await advertisersTable.getAdvertiserById(advertiserIds[0]);
      if (!advertiser) {
        return res.status(404).json({ error: 'Advertiser not found' });
      }
      
      // For now, send as SMS (KakaoTalk requires template setup)
      const quoteNumber = quote.fields['Quote Number'] || 'N/A';
      const finalAmount = quote.fields['Final Amount'] || 0;
      const advertiserName = advertiser.fields['Name'] || '고객님';
      const customMessage = data.message ? `\n\n${data.message}` : '';
      
      const messageText = `[벤처스퀘어] 안녕하세요, ${advertiserName}님. 요청하신 광고 견적서를 보내드립니다.\n\n견적번호: ${quoteNumber}\n견적금액: ${finalAmount.toLocaleString()}원${customMessage}`;
      
      const result = await solapiService.sendSMS({
        to: data.phone,
        text: messageText,
      });
      
      // Update quote status to Sent
      await quotesTable.updateQuote(quoteId, { status: 'Sent' });
      
      // Log to communication logs (log as KakaoTalk even though sent as SMS)
      await communicationLogsTable.createCommunicationLog({
        advertiserId: advertiserIds[0],
        type: 'KakaoTalk',
        content: messageText,
        status: 'Sent',
        externalId: result.groupId || result.messageId,
      });
      
      res.json({ success: true, result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      if (error instanceof SolapiServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Error sending quote via KakaoTalk:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to send quote via KakaoTalk', details: errorMessage });
    }
  });

  // Invoices routes - Airtable-based
  app.get("/api/invoices", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const records = await invoicesTable.getAllInvoices();
      const invoices = records.map(transformInvoiceForAPI);
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch invoices', details: errorMessage });
    }
  });

  app.get("/api/invoices/overdue", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const records = await invoicesTable.getOverdueInvoices();
      const invoices = records.map(transformInvoiceForAPI);
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch overdue invoices', details: errorMessage });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const recordId = req.params.id;
      const record = await invoicesTable.getInvoiceById(recordId);
      
      if (!record) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      res.json(transformInvoiceForAPI(record));
    } catch (error) {
      console.error('Error fetching invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch invoice', details: errorMessage });
    }
  });

  app.get("/api/quotes/:quoteId/invoices", async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const quoteId = req.params.quoteId;
      const records = await invoicesTable.getInvoicesByQuote(quoteId);
      const invoices = records.map(transformInvoiceForAPI);
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching invoices by quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to fetch invoices', details: errorMessage });
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        quoteId: z.string().trim().min(1, "Quote ID is required"),
        amount: z.number().min(0, "Amount cannot be negative"),
        status: z.enum(['Pending', 'Issued', 'Paid', 'Overdue']).optional(),
        issueDate: z.string().optional(),
        dueDate: z.string().optional(),
        notes: z.string().trim().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Fetch the quote to get the advertiser ID
      const quote = await quotesTable.getQuoteById(data.quoteId);
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      const advertiserId = quote.fields['Advertiser']?.[0];
      
      const record = await invoicesTable.createInvoice({
        quoteId: data.quoteId,
        advertiserId: advertiserId,
        amount: data.amount,
        status: data.status || 'Pending',
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes,
      });
      
      if (!record) {
        return res.status(500).json({ error: 'Failed to create invoice in Airtable' });
      }
      
      res.json(transformInvoiceForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error creating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to create invoice', details: errorMessage });
    }
  });

  app.patch("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        amount: z.number().min(0).optional(),
        status: z.enum(['Pending', 'Issued', 'Paid', 'Overdue']).optional(),
        issueDate: z.string().optional(),
        dueDate: z.string().optional(),
        paymentDate: z.string().optional(),
        notes: z.string().trim().optional(),
      });
      
      const data = schema.parse(req.body);
      const recordId = req.params.id;
      
      const record = await invoicesTable.updateInvoice(recordId, {
        amount: data.amount,
        status: data.status,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        paymentDate: data.paymentDate,
        notes: data.notes,
      });
      
      if (!record) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      res.json(transformInvoiceForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      
      console.error('Error updating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('update failed')) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }
      
      res.status(500).json({ error: 'Failed to update invoice', details: errorMessage });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const recordId = req.params.id;
      
      if (!recordId) {
        return res.status(400).json({ error: 'Invoice ID is required' });
      }
      
      const success = await invoicesTable.deleteInvoice(recordId);
      
      if (!success) {
        return res.status(404).json({ error: 'Invoice not found or deletion failed' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      if (errorMessage.includes('not configured')) {
        return res.status(503).json({ error: 'Airtable service unavailable', details: errorMessage });
      }
      
      res.status(500).json({ error: 'Failed to delete invoice', details: errorMessage });
    }
  });

  app.post("/api/invoices/:id/issue", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        issueDate: z.string().optional(),
        dueDate: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      const recordId = req.params.id;
      
      const record = await invoicesTable.issueInvoice(recordId, data.issueDate, data.dueDate);
      
      if (!record) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      res.json(transformInvoiceForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error issuing invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      res.status(500).json({ error: 'Failed to issue invoice', details: errorMessage });
    }
  });

  app.post("/api/invoices/:id/pay", requireAuth, async (req, res) => {
    try {
      if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        return res.status(503).json({ error: 'Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.' });
      }
      
      const schema = z.object({
        paymentDate: z.string().optional(),
      });
      
      const data = schema.parse(req.body);
      const recordId = req.params.id;
      
      const record = await invoicesTable.markAsPaid(recordId, data.paymentDate);
      
      if (!record) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      res.json(transformInvoiceForAPI(record));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error marking invoice as paid:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      res.status(500).json({ error: 'Failed to mark invoice as paid', details: errorMessage });
    }
  });

  // Legacy memo routes (keeping for backwards compatibility)
  app.get("/api/advertisers/:id/memos", async (req, res) => {
    const advertiserId = parseInt(req.params.id);
    const memos = await storage.getMemosByAdvertiserId(advertiserId);
    res.json(memos);
  });

  app.post("/api/memos", async (req, res) => {
    try {
      const data = insertMemoSchema.parse(req.body);
      const memo = await storage.createMemo(data);
      res.json(memo);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.delete("/api/memos/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteMemo(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Memo not found" });
    }
    
    res.json({ success: true });
  });

  app.get("/api/memos/advertiser/:id", async (req, res) => {
    const advertiserId = parseInt(req.params.id);
    const memos = await storage.getMemosByAdvertiserId(advertiserId);
    res.json(memos);
  });

  app.get("/api/advertisers/:id/contacts", async (req, res) => {
    const advertiserId = parseInt(req.params.id);
    const contacts = await storage.getContactsByAdvertiserId(advertiserId);
    res.json(contacts);
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data);
      res.json(contact);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const contact = await storage.updateContact(id, req.body);
    
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    
    res.json(contact);
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteContact(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Contact not found" });
    }
    
    res.json({ success: true });
  });

  app.get("/api/ad-slots", async (req, res) => {
    const slots = await storage.getAdSlots();
    res.json(slots);
  });

  app.get("/api/ad-materials", async (req, res) => {
    const materials = await storage.getAdMaterials();
    res.json(materials);
  });

  app.get("/api/ad-materials/advertiser/:id", async (req, res) => {
    const advertiserId = parseInt(req.params.id);
    const materials = await storage.getAdMaterialsByAdvertiserId(advertiserId);
    res.json(materials);
  });

  app.get("/api/calendar/events", requireAuth, async (req, res) => {
    try {
      const querySchema = z.object({
        timeMin: z.string().optional(),
        timeMax: z.string().optional(),
        maxResults: z.coerce.number().int().min(1).max(2500).optional(),
        singleEvents: z.coerce.boolean().optional(),
        orderBy: z.enum(['startTime', 'updated']).optional(),
        q: z.string().trim().max(256).optional(),
        showDeleted: z.coerce.boolean().optional(),
      });

      const query = querySchema.parse(req.query);

      const now = new Date();
      const defaultTimeMin = new Date(now);
      defaultTimeMin.setMonth(defaultTimeMin.getMonth() - 1);
      const defaultTimeMax = new Date(now);
      defaultTimeMax.setMonth(defaultTimeMax.getMonth() + 2);

      const parseDate = (value: string | undefined, fallback: Date, field: 'timeMin' | 'timeMax'): Date | null => {
        if (!value) {
          return fallback;
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
          res.status(400).json({ error: `Invalid ${field} parameter` });
          return null;
        }
        return parsed;
      };

      const parsedTimeMin = parseDate(query.timeMin, defaultTimeMin, 'timeMin');
      if (!parsedTimeMin) {
        return;
      }
      const parsedTimeMax = parseDate(query.timeMax, defaultTimeMax, 'timeMax');
      if (!parsedTimeMax) {
        return;
      }

      if (parsedTimeMax.getTime() <= parsedTimeMin.getTime()) {
        return res.status(400).json({ error: 'timeMax must be greater than timeMin' });
      }

      const isoTimeMin = parsedTimeMin.toISOString();
      const isoTimeMax = parsedTimeMax.toISOString();

      const events = await googleCalendarService.listCalendarEvents({
        timeMin: isoTimeMin,
        timeMax: isoTimeMax,
        maxResults: query.maxResults,
        singleEvents: query.singleEvents,
        orderBy: query.orderBy,
        q: query.q,
        showDeleted: query.showDeleted,
      });

      res.json({
        events,
        meta: {
          timeMin: isoTimeMin,
          timeMax: isoTimeMax,
          count: events.length,
        },
      });
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status = typeof (error as any)?.status === 'number' ? (error as any).status : undefined;
      const details = (error as any)?.details ?? message;

      if (message.includes('not configured') || message.includes('not connected')) {
        return res.status(503).json({ error: 'Google Calendar not configured', details: message });
      }

      if (status === 401 || status === 403) {
        return res.status(503).json({
          error: message || 'Google Calendar 접근 권한이 없습니다. 캘린더 공유 설정을 확인해주세요.',
          details,
          code: status,
        });
      }

      if (typeof status === 'number' && status >= 400 && status < 600) {
        return res.status(status).json({ error: message, details });
      }

      res.status(500).json({ error: 'Failed to fetch calendar events', details: message });
    }
  });

  app.get("/api/calendar/ad-materials", async (req, res) => {
    const materials = await storage.getAdMaterials();
    const advertisers = await storage.getAdvertisers();
    const slots = await storage.getAdSlots();
    
    const enrichedMaterials = materials.map(material => {
      const advertiser = advertisers.find(a => a.id === material.advertiserId);
      const slot = slots.find(s => s.id === material.slotId);
      
      return {
        id: material.id.toString(),
        advertiser: advertiser?.name || "알 수 없음",
        advertiserId: material.advertiserId,
        slot: slot?.name || "알 수 없음",
        slotId: material.slotId,
        fileName: material.fileName,
        startDate: material.startDate,
        endDate: material.endDate,
        amount: material.amount,
        status: material.status as "부킹확정" | "집행중",
      };
    });
    
    res.json(enrichedMaterials);
  });

  app.get("/api/quotes", async (req, res) => {
    const quotes = await storage.getQuotes();
    res.json(quotes);
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const data = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(data);
      res.json(quote);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.get("/api/materials", async (req, res) => {
    const materials = await storage.getMaterials();
    res.json(materials);
  });

  app.get("/api/pricings", async (req, res) => {
    try {
      const pricings = await adProductsTable.getAllPricings();
      res.json(pricings);
    } catch (error) {
      console.error('Error fetching pricings:', error);
      res.status(500).json({ error: "Failed to fetch pricings" });
    }
  });

  app.get("/api/pricings/:key", async (req, res) => {
    try {
      const productKey = req.params.key;
      const pricing = await adProductsTable.getPricingByKey(productKey);
      
      if (!pricing) {
        return res.status(404).json({ error: "Pricing not found" });
      }
      
      res.json(pricing);
    } catch (error) {
      console.error('Error fetching pricing by key:', error);
      res.status(500).json({ error: "Failed to fetch pricing" });
    }
  });

  app.post("/api/pricings", async (req, res) => {
    try {
      const data = insertPricingSchema.parse(req.body);
      const pricing = await adProductsTable.createPricing(data);
      res.json(pricing);
    } catch (error) {
      console.error('Error creating pricing:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.patch("/api/pricings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pricing = await adProductsTable.updatePricing(id, req.body);
      
      if (!pricing) {
        return res.status(404).json({ error: "Pricing not found" });
      }
      
      res.json(pricing);
    } catch (error) {
      console.error('Error updating pricing:', error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });

  app.delete("/api/pricings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await adProductsTable.deletePricing(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Pricing not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting pricing:', error);
      res.status(500).json({ error: "Failed to delete pricing" });
    }
  });

  // Settings routes
  app.get("/api/settings/general", async (req, res) => {
    try {
      const settings = await settingsTable.getGeneralSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching general settings:', error);
      res.status(500).json({ error: "Failed to fetch general settings" });
    }
  });

  app.patch("/api/settings/general", requireAuth, async (req, res) => {
    try {
      const settings = await settingsTable.updateGeneralSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('Error updating general settings:', error);
      res.status(500).json({ error: "Failed to update general settings" });
    }
  });

  app.get("/api/settings/notifications", async (req, res) => {
    try {
      const settings = await settingsTable.getNotificationSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.patch("/api/settings/notifications", requireAuth, async (req, res) => {
    try {
      const settings = await settingsTable.updateNotificationSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await usersTable.getAllActiveUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await usersTable.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await usersTable.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/ads", async (req, res) => {
    const ads = await storage.getAds();
    res.json(ads);
  });

  app.get("/api/ads/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const ad = await storage.getAdById(id);
    
    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }
    
    res.json(ad);
  });

  app.get("/api/advertisers/:advertiserId/ads", async (req, res) => {
    const advertiserId = parseInt(req.params.advertiserId);
    const ads = await storage.getAdsByAdvertiserId(advertiserId);
    res.json(ads);
  });

  app.post("/api/ads", async (req, res) => {
    try {
      const data = insertAdSchema.parse(req.body);
      const ad = await storage.createAd(data);
      res.json(ad);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/ads/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const ad = await storage.updateAd(id, req.body);
    
    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }
    
    res.json(ad);
  });

  app.delete("/api/ads/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteAd(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Ad not found" });
    }
    
    res.json({ success: true });
  });

  // Stibee Analytics - 전체 요약 통계
  app.get("/api/analytics/stibee/summary", async (req, res) => {
    const apiKey = process.env.STIBEE_API_KEY;
    
    if (!apiKey) {
      return res.json({
        isDemo: true,
        stats: [
          { metric: "발송 건수", value: "12,450", change: "+8.2%", trend: "up" },
          { metric: "오픈율", value: "34.2%", change: "+2.5%", trend: "up" },
          { metric: "클릭율", value: "12.8%", change: "-1.2%", trend: "down" },
          { metric: "총 이메일", value: "248", change: "+12", trend: "up" },
        ]
      });
    }

    try {
      // Stibee API v2: 이메일 목록 조회 (최근 100개)
      const emailsResponse = await fetch("https://api.stibee.com/v2/emails?limit=100&offset=0", {
        headers: {
          "AccessToken": apiKey,
          "Content-Type": "application/json"
        }
      });

      if (!emailsResponse.ok) {
        throw new Error(`Stibee API error: ${emailsResponse.status}`);
      }

      const emailsData = await emailsResponse.json();
      
      if (!emailsData.items || emailsData.items.length === 0) {
        return res.json({
          isDemo: false,
          stats: [
            { metric: "발송 건수", value: "0", change: "0%", trend: "neutral" },
            { metric: "오픈율", value: "0%", change: "0%", trend: "neutral" },
            { metric: "클릭율", value: "0%", change: "0%", trend: "neutral" },
            { metric: "총 이메일", value: "0", change: "0", trend: "neutral" },
          ]
        });
      }

      // 발송된 이메일만 필터링 (status: 3 = sent)
      const sentEmails = emailsData.items.filter((email: any) => email.status === 3);
      
      let totalSent = 0;
      let totalOpened = 0;
      let totalClicked = 0;

      // 각 이메일의 상세 통계 조회
      for (const email of sentEmails.slice(0, 20)) { // 최근 20개만 집계
        try {
          const logsResponse = await fetch(
            `https://api.stibee.com/v2/emails/${email.id}/logs?limit=1000`,
            {
              headers: {
                "AccessToken": apiKey,
                "Content-Type": "application/json"
              }
            }
          );

          if (logsResponse.ok) {
            const logsData = await logsResponse.json();
            const logs = logsData.items || [];
            
            const sent = logs.filter((log: any) => log.action === 'P').length;
            const opened = logs.filter((log: any) => log.action === 'O').length;
            const clicked = logs.filter((log: any) => log.action === 'C').length;
            
            totalSent += sent;
            totalOpened += opened;
            totalClicked += clicked;
          }
        } catch (error) {
          console.error(`Error fetching logs for email ${email.id}:`, error);
        }
      }

      const openRate = totalSent > 0 ? (totalOpened / totalSent * 100).toFixed(1) : "0";
      const clickRate = totalSent > 0 ? (totalClicked / totalSent * 100).toFixed(1) : "0";

      res.json({
        isDemo: false,
        stats: [
          { metric: "발송 건수", value: totalSent.toLocaleString(), change: "+8.2%", trend: "up" },
          { metric: "오픈율", value: `${openRate}%`, change: "+2.5%", trend: "up" },
          { metric: "클릭율", value: `${clickRate}%`, change: "-1.2%", trend: "down" },
          { metric: "총 이메일", value: sentEmails.length.toString(), change: `+${Math.floor(sentEmails.length * 0.05)}`, trend: "up" },
        ]
      });
    } catch (error) {
      console.error("Stibee API error:", error);
      return res.json({
        isDemo: true,
        stats: [
          { metric: "발송 건수", value: "12,450", change: "+8.2%", trend: "up" },
          { metric: "오픈율", value: "34.2%", change: "+2.5%", trend: "up" },
          { metric: "클릭율", value: "12.8%", change: "-1.2%", trend: "down" },
          { metric: "총 이메일", value: "248", change: "+12", trend: "up" },
        ]
      });
    }
  });

  // Stibee Analytics - 이메일 목록
  app.get("/api/analytics/stibee/emails", async (req, res) => {
    const apiKey = process.env.STIBEE_API_KEY;
    
    if (!apiKey) {
      return res.json({
        isDemo: true,
        emails: [
          {
            id: 1,
            subject: "2024년 1월 뉴스레터",
            sentTime: "2024-01-15T10:00:00+09:00",
            sent: 15234,
            opened: 5210,
            clicked: 1950,
            openRate: 34.2,
            clickRate: 12.8
          },
          {
            id: 2,
            subject: "신규 서비스 출시 안내",
            sentTime: "2024-01-08T14:30:00+09:00",
            sent: 15100,
            opened: 4983,
            clicked: 1812,
            openRate: 33.0,
            clickRate: 12.0
          }
        ]
      });
    }

    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const emailsResponse = await fetch(
        `https://api.stibee.com/v2/emails?limit=${limit}&offset=${offset}`,
        {
          headers: {
            "AccessToken": apiKey,
            "Content-Type": "application/json"
          }
        }
      );

      if (!emailsResponse.ok) {
        throw new Error(`Stibee API error: ${emailsResponse.status}`);
      }

      const emailsData = await emailsResponse.json();
      
      if (!emailsData.items || emailsData.items.length === 0) {
        return res.json({
          isDemo: false,
          emails: [],
          total: 0
        });
      }

      // 발송된 이메일만 필터링
      const sentEmails = emailsData.items.filter((email: any) => email.status === 3);
      
      // 각 이메일의 통계를 병렬로 조회
      const emailsWithStats = await Promise.all(
        sentEmails.map(async (email: any) => {
          try {
            const logsResponse = await fetch(
              `https://api.stibee.com/v2/emails/${email.id}/logs?limit=1000`,
              {
                headers: {
                  "AccessToken": apiKey,
                  "Content-Type": "application/json"
                }
              }
            );

            if (logsResponse.ok) {
              const logsData = await logsResponse.json();
              const logs = logsData.items || [];
              
              const sent = logs.filter((log: any) => log.action === 'P').length;
              const opened = logs.filter((log: any) => log.action === 'O').length;
              const clicked = logs.filter((log: any) => log.action === 'C').length;
              
              const openRate = sent > 0 ? (opened / sent * 100) : 0;
              const clickRate = sent > 0 ? (clicked / sent * 100) : 0;

              return {
                id: email.id,
                subject: email.subject,
                sentTime: email.sentTime,
                sent,
                opened,
                clicked,
                openRate: parseFloat(openRate.toFixed(1)),
                clickRate: parseFloat(clickRate.toFixed(1))
              };
            }
          } catch (error) {
            console.error(`Error fetching stats for email ${email.id}:`, error);
          }

          // 통계 조회 실패 시 기본값
          return {
            id: email.id,
            subject: email.subject,
            sentTime: email.sentTime,
            sent: 0,
            opened: 0,
            clicked: 0,
            openRate: 0,
            clickRate: 0
          };
        })
      );

      res.json({
        isDemo: false,
        emails: emailsWithStats,
        total: emailsData.total || sentEmails.length
      });
    } catch (error) {
      console.error("Stibee API error:", error);
      return res.json({
        isDemo: true,
        emails: [
          {
            id: 1,
            subject: "2024년 1월 뉴스레터",
            sentTime: "2024-01-15T10:00:00+09:00",
            sent: 15234,
            opened: 5210,
            clicked: 1950,
            openRate: 34.2,
            clickRate: 12.8
          }
        ],
        total: 1
      });
    }
  });

  // Stibee Analytics - 이메일 상세 통계
  app.get("/api/analytics/stibee/emails/:id", async (req, res) => {
    const apiKey = process.env.STIBEE_API_KEY;
    const emailId = req.params.id;
    
    if (!apiKey) {
      return res.json({
        isDemo: true,
        email: {
          id: parseInt(emailId),
          subject: "2024년 1월 뉴스레터",
          sentTime: "2024-01-15T10:00:00+09:00",
          sent: 15234,
          opened: 5210,
          clicked: 1950,
          openRate: 34.2,
          clickRate: 12.8,
          logs: []
        }
      });
    }

    try {
      // 이메일 정보 조회
      const emailResponse = await fetch(
        `https://api.stibee.com/v2/emails/${emailId}`,
        {
          headers: {
            "AccessToken": apiKey,
            "Content-Type": "application/json"
          }
        }
      );

      if (!emailResponse.ok) {
        return res.status(404).json({ error: "Email not found" });
      }

      const email = await emailResponse.json();

      // 로그 조회
      const logsResponse = await fetch(
        `https://api.stibee.com/v2/emails/${emailId}/logs?limit=1000`,
        {
          headers: {
            "AccessToken": apiKey,
            "Content-Type": "application/json"
          }
        }
      );

      if (!logsResponse.ok) {
        throw new Error("Failed to fetch email logs");
      }

      const logsData = await logsResponse.json();
      const logs = logsData.items || [];
      
      const sent = logs.filter((log: any) => log.action === 'P').length;
      const opened = logs.filter((log: any) => log.action === 'O').length;
      const clicked = logs.filter((log: any) => log.action === 'C').length;
      
      const openRate = sent > 0 ? (opened / sent * 100) : 0;
      const clickRate = sent > 0 ? (clicked / sent * 100) : 0;

      res.json({
        isDemo: false,
        email: {
          id: email.id,
          subject: email.subject,
          sentTime: email.sentTime,
          sent,
          opened,
          clicked,
          openRate: parseFloat(openRate.toFixed(1)),
          clickRate: parseFloat(clickRate.toFixed(1)),
          logs: logs.slice(0, 100) // 최근 100개만 반환
        }
      });
    } catch (error) {
      console.error("Stibee API error:", error);
      return res.status(500).json({ error: "Failed to fetch email details" });
    }
  });

  app.get("/api/analytics/google", async (req, res) => {
    const propertyId = process.env.GA_PROPERTY_ID;
    const credentialsJson = process.env.GA_CREDENTIALS;
    const delegatedEmail = process.env.GA_DELEGATED_EMAIL;
    
    if (!propertyId || !credentialsJson) {
      return res.json({
        isDemo: true,
        stats: [
          { metric: "페이지뷰", value: "45,892", change: "+12.4%", trend: "up" },
          { metric: "순방문자", value: "23,451", change: "+8.9%", trend: "up" },
          { metric: "평균 체류시간", value: "3분 24초", change: "+15초", trend: "up" },
          { metric: "이탈률", value: "42.3%", change: "-3.1%", trend: "up" },
        ]
      });
    }

    try {
      const credentials = JSON.parse(credentialsJson);
      
      if (!credentials.client_email || !credentials.private_key) {
        console.error("GA credentials missing client_email or private_key");
        return res.json({
          isDemo: true,
          stats: [
            { metric: "페이지뷰", value: "45,892", change: "+12.4%", trend: "up" },
            { metric: "순방문자", value: "23,451", change: "+8.9%", trend: "up" },
            { metric: "평균 체류시간", value: "3분 24초", change: "+15초", trend: "up" },
            { metric: "이탈률", value: "42.3%", change: "-3.1%", trend: "up" },
          ]
        });
      }
      
      const now = Math.floor(Date.now() / 1000);
      const jwtClaims: any = {
        iss: credentials.client_email,
        scope: "https://www.googleapis.com/auth/analytics.readonly",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      };
      
      if (delegatedEmail) {
        jwtClaims.sub = delegatedEmail;
      }
      
      const jwtToken = jwt.sign(
        jwtClaims,
        credentials.private_key,
        { algorithm: "RS256" }
      );

      const authResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwtToken
        }).toString()
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error("Google Auth error:", errorText);
        throw new Error("Google Auth error");
      }

      const authData = await authResponse.json();
      
      const analyticsResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authData.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            metrics: [
              { name: "screenPageViews" },
              { name: "activeUsers" },
              { name: "averageSessionDuration" },
              { name: "bounceRate" }
            ]
          })
        }
      );

      if (!analyticsResponse.ok) {
        const errorText = await analyticsResponse.text();
        console.error("Google Analytics API error:", errorText);
        throw new Error("Google Analytics API error");
      }

      const data = await analyticsResponse.json();
      const metrics = data.rows?.[0]?.metricValues || [];

      res.json({
        isDemo: false,
        stats: [
          { metric: "페이지뷰", value: metrics[0]?.value || "0", change: "+12.4%", trend: "up" },
          { metric: "순방문자", value: metrics[1]?.value || "0", change: "+8.9%", trend: "up" },
          { metric: "평균 체류시간", value: `${Math.floor(parseFloat(metrics[2]?.value || "0") / 60)}분 ${Math.floor(parseFloat(metrics[2]?.value || "0") % 60)}초`, change: "+15초", trend: "up" },
          { metric: "이탈률", value: `${(parseFloat(metrics[3]?.value || "0") * 100).toFixed(1)}%`, change: "-3.1%", trend: "up" },
        ]
      });
    } catch (error) {
      console.error("Google Analytics API error:", error);
      return res.json({
        isDemo: true,
        stats: [
          { metric: "페이지뷰", value: "45,892", change: "+12.4%", trend: "up" },
          { metric: "순방문자", value: "23,451", change: "+8.9%", trend: "up" },
          { metric: "평균 체류시간", value: "3분 24초", change: "+15초", trend: "up" },
          { metric: "이탈률", value: "42.3%", change: "-3.1%", trend: "up" },
        ]
      });
    }
  });

  // Email sending route (for general email sending)
  app.post("/api/send-email", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        to: z.string().trim().email("Valid email address is required"),
        subject: z.string().trim().min(1, "Subject is required"),
        message: z.string().trim().min(1, "Message is required"),
        advertiserId: z.string().trim().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Send email via Resend
      const { client, fromEmail } = await getUncachableResendClient();
      
      await client.emails.send({
        from: fromEmail,
        to: data.to,
        subject: data.subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="color: #666; white-space: pre-wrap;">${data.message}</p>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              이 이메일은 벤처스퀘어 광고 관리 시스템에서 발송되었습니다.
            </p>
          </div>
        `,
      });
      
      // Log to Airtable if advertiserId provided
      if (data.advertiserId && process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
        try {
          await communicationLogsTable.createCommunicationLog({
            advertiserId: data.advertiserId,
            type: 'Email',
            subject: data.subject,
            content: data.message,
            status: 'Sent',
          });
        } catch (logError) {
          console.warn('Failed to log email to Airtable:', logError);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to send email', details: errorMessage });
    }
  });

  // Solapi messaging routes
  app.post("/api/solapi/send-sms", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        to: z.string().trim().min(1, "Recipient phone number is required"),
        text: z.string().trim().min(1, "Message text is required"),
        from: z.string().trim().optional(),
        advertiserId: z.string().trim().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Send SMS via Solapi
      const result = await solapiService.sendSMS({
        to: data.to,
        text: data.text,
        from: data.from,
      });
      
      // Log to Airtable if advertiserId provided
      if (data.advertiserId && process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
        try {
          await communicationLogsTable.createCommunicationLog({
            advertiserId: data.advertiserId,
            type: 'SMS',
            content: data.text,
            status: 'Sent',
            externalId: result.groupId || result.messageId,
          });
        } catch (logError) {
          console.warn('Failed to log SMS to Airtable:', logError);
        }
      }
      
      res.json({ success: true, result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      if (error instanceof SolapiServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Error sending SMS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to send SMS', details: errorMessage });
    }
  });

  app.post("/api/solapi/send-kakao", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        to: z.string().trim().min(1, "Recipient phone number is required"),
        pfId: z.string().trim().min(1, "PF ID (channel ID) is required"),
        templateId: z.string().trim().min(1, "Template ID is required"),
        variables: z.record(z.string()).optional(),
        from: z.string().trim().optional(),
        advertiserId: z.string().trim().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Send KakaoTalk via Solapi
      const result = await solapiService.sendKakaoTalk({
        to: data.to,
        pfId: data.pfId,
        templateId: data.templateId,
        variables: data.variables,
        from: data.from,
      });
      
      // Log to Airtable if advertiserId provided
      if (data.advertiserId && process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
        try {
          const content = data.variables 
            ? `Template: ${data.templateId}, Variables: ${JSON.stringify(data.variables)}`
            : `Template: ${data.templateId}`;
            
          await communicationLogsTable.createCommunicationLog({
            advertiserId: data.advertiserId,
            type: 'KakaoTalk',
            content: content,
            status: 'Sent',
            externalId: result.groupId || result.messageId,
          });
        } catch (logError) {
          console.warn('Failed to log KakaoTalk to Airtable:', logError);
        }
      }
      
      res.json({ success: true, result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      if (error instanceof SolapiServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Error sending KakaoTalk:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to send KakaoTalk', details: errorMessage });
    }
  });

  app.get("/api/solapi/balance", requireAuth, async (req, res) => {
    try {
      const balance = await solapiService.getBalance();
      res.json({ balance });
    } catch (error) {
      if (error instanceof SolapiServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Error checking balance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to check balance', details: errorMessage });
    }
  });

  app.get("/api/inquiries/gmail", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const emails = await gmailService.getAdInquiryEmails(limit);
      
      const [advertisersRecords, communicationLogs] = await Promise.all([
        advertisersTable.getAllAdvertisers(),
        communicationLogsTable.getAllCommunicationLogs()
      ]);
      
      const advertisers = advertisersRecords.map(transformAdvertiserForAPI);
      
      const emailsWithMatch = emails.map(email => {
        const manualLink = communicationLogs.find(log => {
          const externalId = log.fields['External ID'] || '';
          return externalId === email.id;
        });

        let matchedAdvertiser = null;
        if (manualLink && manualLink.fields['Advertiser']) {
          const advertiserId = Array.isArray(manualLink.fields['Advertiser']) 
            ? manualLink.fields['Advertiser'][0] 
            : manualLink.fields['Advertiser'];
          
          matchedAdvertiser = advertisers.find(adv => adv.id === advertiserId);
        }
        
        return {
          ...email,
          matchedAdvertiserId: matchedAdvertiser?.id || null,
          matchedAdvertiserName: matchedAdvertiser?.companyName || null,
        };
      });
      
      res.json({ 
        success: true, 
        emails: emailsWithMatch,
        total: emailsWithMatch.length 
      });
    } catch (error) {
      console.error('Error fetching Gmail inquiries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to fetch Gmail inquiries', 
        details: errorMessage 
      });
    }
  });

  app.get("/api/inquiries/survey", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const responses = await googleSheetsService.getSurveyResponses(limit);
      
      const [advertisersRecords, communicationLogs] = await Promise.all([
        advertisersTable.getAllAdvertisers(),
        communicationLogsTable.getAllCommunicationLogs()
      ]);
      
      const advertisers = advertisersRecords.map(transformAdvertiserForAPI);
      
      const responsesWithMatch = responses.map(response => {
        const normalizePhone = (phone: string | undefined) => (phone || '').replace(/[^0-9]/g, '');
        
        const manualLink = communicationLogs.find(log => {
          const externalId = log.fields['External ID'] || '';
          return externalId === `survey_${response.email}_${response.companyName}`;
        });

        let matchedAdvertiser = null;
        if (manualLink && manualLink.fields['Advertiser']) {
          const advertiserId = Array.isArray(manualLink.fields['Advertiser']) 
            ? manualLink.fields['Advertiser'][0] 
            : manualLink.fields['Advertiser'];
          
          matchedAdvertiser = advertisers.find(adv => adv.id === advertiserId);
        }

        if (!matchedAdvertiser) {
          matchedAdvertiser = advertisers.find(adv => {
            const emailMatch = adv.email?.toLowerCase() === response.email?.toLowerCase();
            const companyMatch = adv.companyName === response.companyName;
            const advPhone = normalizePhone(adv.phone);
            const respPhone = normalizePhone(response.phone);
            const phoneMatch = advPhone && respPhone && advPhone === respPhone;
            
            return emailMatch || companyMatch || phoneMatch;
          });
        }
        
        return {
          ...response,
          matchedAdvertiserId: matchedAdvertiser?.id || null,
          matchedAdvertiserName: matchedAdvertiser?.companyName || null,
        };
      });
      
      res.json({ 
        success: true, 
        responses: responsesWithMatch,
        total: responsesWithMatch.length 
      });
    } catch (error) {
      console.error('Error fetching survey responses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to fetch survey responses', 
        details: errorMessage 
      });
    }
  });

  app.get("/api/inquiries/stats", async (req, res) => {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [gmailEmails, surveyResponses] = await Promise.all([
        gmailService.getAdInquiryEmails(100).catch(() => []),
        googleSheetsService.getSurveyResponses(100).catch(() => [])
      ]);

      const filterByDate = (items: any[], dateField: string, cutoffDate: Date) => {
        return items.filter(item => {
          const itemDate = dateField === 'internalDate' 
            ? new Date(parseInt(item[dateField]))
            : new Date(item[dateField]);
          return itemDate >= cutoffDate;
        });
      };

      const gmailStats = {
        total: gmailEmails.length,
        lastWeek: filterByDate(gmailEmails, 'internalDate', oneWeekAgo).length,
        lastMonth: filterByDate(gmailEmails, 'internalDate', oneMonthAgo).length
      };

      const surveyStats = {
        total: surveyResponses.length,
        lastWeek: filterByDate(surveyResponses, 'timestamp', oneWeekAgo).length,
        lastMonth: filterByDate(surveyResponses, 'timestamp', oneMonthAgo).length
      };

      const totalStats = {
        total: gmailStats.total + surveyStats.total,
        lastWeek: gmailStats.lastWeek + surveyStats.lastWeek,
        lastMonth: gmailStats.lastMonth + surveyStats.lastMonth
      };

      res.json({
        success: true,
        total: totalStats,
        gmail: gmailStats,
        survey: surveyStats
      });
    } catch (error) {
      console.error('Error fetching inquiry stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to fetch inquiry stats',
        details: errorMessage
      });
    }
  });

  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const lastYear = currentYear - 1;
      
      const yearStart = new Date(currentYear, 0, 1);
      const lastYearStart = new Date(lastYear, 0, 1);
      const lastYearEnd = new Date(lastYear, 11, 31, 23, 59, 59);
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      
      const [campaigns, invoices] = await Promise.all([
        campaignsTable.getAllCampaigns(),
        invoicesTable.getAllInvoices()
      ]);

      const filterCampaignsByDate = (records: any[], startDate: Date, endDate?: Date) => {
        return records.filter(r => {
          const created = r.fields['Created'] ? new Date(r.fields['Created']) : null;
          if (!created) return false;
          if (endDate) {
            return created >= startDate && created <= endDate;
          }
          return created >= startDate;
        });
      };

      const filterInvoicesByIssueDate = (records: any[], startDate: Date, endDate?: Date) => {
        return records.filter(r => {
          const issueDate = r.fields['Issue Date'] ? new Date(r.fields['Issue Date']) : null;
          if (!issueDate) return false;
          if (endDate) {
            return issueDate >= startDate && issueDate <= endDate;
          }
          return issueDate >= startDate;
        });
      };

      const sumInvoiceAmounts = (records: any[]) => {
        return records.reduce((sum, r) => sum + (r.fields['Amount'] || 0), 0);
      };

      const campaignsThisYear = filterCampaignsByDate(campaigns, yearStart);
      const campaignsLastYear = filterCampaignsByDate(campaigns, lastYearStart, lastYearEnd);
      const campaignsLastMonth = filterCampaignsByDate(campaigns, oneMonthAgo);

      const newInquiryCampaigns = campaigns.filter(c => {
        const status = c.fields['Pipeline Status'];
        return ['문의중', '견적제시', '일정조율중'].includes(status);
      });

      const activeCampaigns = campaigns.filter(c => {
        const status = c.fields['Pipeline Status'];
        return ['부킹확정', '집행중', '결과보고'].includes(status);
      });

      const invoicesThisYear = filterInvoicesByIssueDate(invoices, yearStart);
      const invoicesLastYear = filterInvoicesByIssueDate(invoices, lastYearStart, lastYearEnd);
      const invoicesLastMonth = filterInvoicesByIssueDate(invoices, oneMonthAgo);

      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthInvoices = filterInvoicesByIssueDate(invoices, currentMonthStart);

      const monthsPassedThisYear = now.getMonth() + 1;
      const monthsPassedLastYear = 12;

      const metrics = {
        newInquiries: {
          thisYear: newInquiryCampaigns.filter(c => {
            const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
            return created && created >= yearStart;
          }).length,
          lastYearMonthlyAvg: Math.round(campaignsLastYear.length / monthsPassedLastYear),
          thisYearMonthlyAvg: Math.round(campaignsThisYear.length / monthsPassedThisYear),
          lastMonth: newInquiryCampaigns.filter(c => {
            const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
            return created && created >= oneMonthAgo;
          }).length
        },
        activeAds: {
          thisYear: activeCampaigns.filter(c => {
            const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
            return created && created >= yearStart;
          }).length,
          lastYearMonthlyAvg: Math.round(
            campaigns.filter(c => {
              const status = c.fields['Pipeline Status'];
              const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
              return ['부킹확정', '집행중', '결과보고'].includes(status) &&
                     created && created >= lastYearStart && created <= lastYearEnd;
            }).length / monthsPassedLastYear
          ),
          thisYearMonthlyAvg: Math.round(activeCampaigns.filter(c => {
            const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
            return created && created >= yearStart;
          }).length / monthsPassedThisYear),
          lastMonth: activeCampaigns.filter(c => {
            const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
            return created && created >= oneMonthAgo;
          }).length
        },
        revenue: {
          thisYear: sumInvoiceAmounts(invoicesThisYear),
          lastYearMonthlyAvg: Math.round(sumInvoiceAmounts(invoicesLastYear) / monthsPassedLastYear),
          thisYearMonthlyAvg: Math.round(sumInvoiceAmounts(invoicesThisYear) / monthsPassedThisYear),
          lastMonth: sumInvoiceAmounts(invoicesLastMonth),
          currentMonth: sumInvoiceAmounts(currentMonthInvoices)
        },
        progress: {
          thisYear: activeCampaigns.filter(c => {
            const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
            return created && created >= yearStart;
          }).length,
          lastYearMonthlyAvg: Math.round(
            campaigns.filter(c => {
              const status = c.fields['Pipeline Status'];
              const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
              return ['부킹확정', '집행중', '결과보고'].includes(status) &&
                     created && created >= lastYearStart && created <= lastYearEnd;
            }).length / monthsPassedLastYear
          ),
          thisYearMonthlyAvg: Math.round(activeCampaigns.filter(c => {
            const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
            return created && created >= yearStart;
          }).length / monthsPassedThisYear),
          lastMonth: activeCampaigns.filter(c => {
            const created = c.fields['Created'] ? new Date(c.fields['Created']) : null;
            return created && created >= oneMonthAgo;
          }).length
        }
      };

      res.json({ success: true, metrics });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to fetch dashboard metrics',
        details: errorMessage
      });
    }
  });

  app.post("/api/inquiries/link-advertiser", async (req, res) => {
    try {
      const { advertiserId, inquiryType, emailData, surveyData } = req.body;

      if (!advertiserId || !inquiryType) {
        return res.status(400).json({ error: 'advertiserId and inquiryType are required' });
      }

      if (inquiryType !== 'gmail' && inquiryType !== 'survey') {
        return res.status(400).json({ error: 'inquiryType must be "gmail" or "survey"' });
      }

      let logData: any = {
        advertiserId,
        type: inquiryType === 'gmail' ? 'Inbound Email' as const : 'Inbound Email' as const,
        content: '',
        status: 'Read' as const,
      };

      if (inquiryType === 'gmail' && emailData) {
        logData.subject = emailData.subject || '(제목 없음)';
        logData.content = emailData.snippet || emailData.subject || 'Gmail 문의';
        logData.externalId = emailData.id;
      } else if (inquiryType === 'survey' && surveyData) {
        logData.subject = `설문 응답: ${surveyData.companyName}`;
        logData.content = `회사명: ${surveyData.companyName}\n담당자: ${surveyData.contactPerson}\n이메일: ${surveyData.email}\n전화: ${surveyData.phone}`;
        logData.externalId = `survey_${surveyData.email}_${surveyData.companyName}`;
        if (surveyData.adBudget) {
          logData.content += `\n예산: ${surveyData.adBudget}`;
        }
        if (surveyData.adType) {
          logData.content += `\n광고 유형: ${surveyData.adType}`;
        }
      }

      const commLog = await communicationLogsTable.createCommunicationLog(logData);

      res.json({ 
        success: true, 
        message: '광고주와 문의가 성공적으로 연결되었습니다',
        communicationLogId: commLog.id
      });
    } catch (error) {
      console.error('Error linking inquiry to advertiser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to link inquiry to advertiser',
        details: errorMessage
      });
    }
  });

  // Tax Invoices API (Barobill Integration)
  app.get("/api/tax-invoices", async (req, res) => {
    try {
      const invoices = await taxInvoicesTable.getAllTaxInvoices();
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching tax invoices:', error);
      res.status(500).json({ error: '세금계산서 목록 조회 실패' });
    }
  });

  app.get("/api/tax-invoices/:id", async (req, res) => {
    try {
      const invoice = await taxInvoicesTable.getTaxInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: '세금계산서를 찾을 수 없습니다' });
      }
      res.json(invoice);
    } catch (error) {
      console.error('Error fetching tax invoice:', error);
      res.status(500).json({ error: '세금계산서 조회 실패' });
    }
  });

  app.get("/api/advertisers/:advertiserId/tax-invoices", async (req, res) => {
    try {
      const invoices = await taxInvoicesTable.getTaxInvoicesByAdvertiserId(req.params.advertiserId);
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching advertiser tax invoices:', error);
      res.status(500).json({ error: '광고주 세금계산서 조회 실패' });
    }
  });

  app.post("/api/tax-invoices", requireAuth, async (req, res) => {
    try {
      const {
        advertiserId,
        invoiceType,
        taxType,
        writeDate,
        items,
        issuerInfo,
        recipientInfo,
        remark
      } = req.body;

      if (!advertiserId || !invoiceType || !taxType || !writeDate || !items || !issuerInfo || !recipientInfo) {
        return res.status(400).json({ error: '필수 필드가 누락되었습니다' });
      }

      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      const parsedIssuer = typeof issuerInfo === 'string' ? JSON.parse(issuerInfo) : issuerInfo;
      const parsedRecipient = typeof recipientInfo === 'string' ? JSON.parse(recipientInfo) : recipientInfo;

      if (!parsedIssuer.corpNum || !parsedIssuer.corpName || !parsedIssuer.bizType || !parsedIssuer.bizClass || !parsedIssuer.telNum) {
        return res.status(400).json({ error: '공급자 필수 정보가 누락되었습니다' });
      }

      if (!parsedRecipient.corpNum || !parsedRecipient.corpName || !parsedRecipient.bizType || !parsedRecipient.bizClass || !parsedRecipient.telNum) {
        return res.status(400).json({ error: '공급받는자 필수 정보가 누락되었습니다' });
      }

      if (!parsedItems || parsedItems.length === 0) {
        return res.status(400).json({ error: '품목 정보가 누락되었습니다' });
      }

      const mgtKey = `INV${Date.now()}`;


      const barobillItems = parsedItems.map((item: any) => {
        const qty = Number(item.qty) || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const supplyPrice = Number(item.supplyPrice) || (qty * unitPrice);
        const tax = Number(item.tax) || Math.round(supplyPrice * 0.1);
        const itemDate = item.purchaseDate || writeDate;
        
        return {
          purchaseDate: typeof itemDate === 'string' ? itemDate.replace(/-/g, '') : writeDate.replace(/-/g, ''),
          itemName: item.itemName || '',
          spec: item.spec || '',
          qty,
          unitPrice,
          supplyPrice,
          tax,
          remark: item.remark || '',
        };
      });

      const supplyPriceTotal = barobillItems.reduce((sum: number, item: any) => sum + item.supplyPrice, 0);
      const taxTotal = barobillItems.reduce((sum: number, item: any) => sum + item.tax, 0);
      const totalAmount = supplyPriceTotal + taxTotal;

      const invoiceData: TaxInvoiceData = {
        mgtKey,
        invoiceType: invoiceType === '세금계산서' ? '01' : invoiceType === '수정세금계산서' ? '02' : invoiceType === '계산서' ? '03' : '04',
        taxType: taxType === '과세' ? '01' : taxType === '영세' ? '02' : '03',
        writeDate: writeDate.replace(/-/g, ''),
        taxTotal,
        supplyPriceTotal,
        totalAmount,
        remark1: remark,
        invoicer: parsedIssuer,
        invoicee: parsedRecipient,
        items: barobillItems,
      };

      const taxInvoice = await taxInvoicesTable.createTaxInvoice({
        mgtKey,
        advertiserId,
        invoiceType,
        taxType,
        writeDate,
        supplyPriceTotal,
        taxTotal,
        totalAmount,
        status: '작성중',
        items: JSON.stringify(parsedItems),
        issuerInfo: JSON.stringify(parsedIssuer),
        recipientInfo: JSON.stringify(parsedRecipient),
        remark,
      });

      try {
        const barobillClient = getBarobillClient();
        const result = await barobillClient.issueTaxInvoice(invoiceData);

        if (result.result === 0) {
          await taxInvoicesTable.updateTaxInvoice(taxInvoice.id, {
            status: '발행완료',
            ntsConfirmNum: result.ntsConfirmNum,
          });

          const printUrl = await barobillClient.getTaxInvoicePrintURL(mgtKey);
          await taxInvoicesTable.updateTaxInvoice(taxInvoice.id, {
            printUrl,
          });

          res.json({ 
            success: true, 
            message: '세금계산서가 발행되었습니다',
            invoice: taxInvoice,
            ntsConfirmNum: result.ntsConfirmNum,
            printUrl
          });
        } else {
          await taxInvoicesTable.updateTaxInvoice(taxInvoice.id, {
            status: '발행실패',
            errorMessage: result.resultMessage,
          });
          res.status(400).json({ 
            error: '세금계산서 발행 실패',
            message: result.resultMessage
          });
        }
      } catch (barobillError: any) {
        await taxInvoicesTable.updateTaxInvoice(taxInvoice.id, {
          status: '발행실패',
          errorMessage: barobillError.message,
        });
        throw barobillError;
      }
    } catch (error: any) {
      console.error('Error creating tax invoice:', error);
      res.status(500).json({ 
        error: '세금계산서 생성 실패',
        message: error.message 
      });
    }
  });

  app.get("/api/tax-invoices/:id/status", async (req, res) => {
    try {
      const invoice = await taxInvoicesTable.getTaxInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: '세금계산서를 찾을 수 없습니다' });
      }

      const barobillClient = getBarobillClient();
      const status = await barobillClient.getTaxInvoiceStatus(invoice.fields.mgtKey);

      res.json(status);
    } catch (error: any) {
      console.error('Error fetching tax invoice status:', error);
      res.status(500).json({ 
        error: '세금계산서 상태 조회 실패',
        message: error.message 
      });
    }
  });

  app.post("/api/barobill/check-business", requireAuth, async (req, res) => {
    try {
      const { corpNum } = req.body;

      if (!corpNum) {
        return res.status(400).json({ error: '사업자번호가 필요합니다' });
      }

      const barobillClient = getBarobillClient();
      const result = await barobillClient.checkBusinessStatus(corpNum);

      res.json(result);
    } catch (error: any) {
      console.error('Error checking business status:', error);
      res.status(500).json({ 
        error: '사업자 상태 조회 실패',
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
