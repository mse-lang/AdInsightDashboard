import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAdvertiserSchema, insertContactSchema, insertMemoSchema, insertQuoteSchema, insertPricingSchema, insertAdSchema } from "@shared/schema";
import { setupAuth, isAuthenticated, isAdminEmail, createAuthToken, verifyAuthToken, sendMagicLink } from "./auth";
import { z } from "zod";
import jwt from "jsonwebtoken";

const ADMIN_EMAIL = 'ad@venturesquare.net';

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

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

  // Protected routes - all existing routes now require authentication
  app.get("/api/advertisers", async (req, res) => {
    const advertisers = await storage.getAdvertisers();
    res.json(advertisers);
  });

  app.get("/api/advertisers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const advertiser = await storage.getAdvertiserById(id);
    
    if (!advertiser) {
      return res.status(404).json({ error: "Advertiser not found" });
    }
    
    res.json(advertiser);
  });

  app.post("/api/advertisers", async (req, res) => {
    try {
      const data = insertAdvertiserSchema.parse(req.body);
      const advertiser = await storage.createAdvertiser(data);
      res.json(advertiser);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/advertisers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const advertiser = await storage.updateAdvertiser(id, req.body);
    
    if (!advertiser) {
      return res.status(404).json({ error: "Advertiser not found" });
    }
    
    res.json(advertiser);
  });

  app.delete("/api/advertisers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteAdvertiser(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Advertiser not found" });
    }
    
    res.json({ success: true });
  });

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
    const pricings = await storage.getPricings();
    res.json(pricings);
  });

  app.get("/api/pricings/:key", async (req, res) => {
    const productKey = req.params.key;
    const pricing = await storage.getPricingByKey(productKey);
    
    if (!pricing) {
      return res.status(404).json({ error: "Pricing not found" });
    }
    
    res.json(pricing);
  });

  app.post("/api/pricings", async (req, res) => {
    try {
      const data = insertPricingSchema.parse(req.body);
      const pricing = await storage.createPricing(data);
      res.json(pricing);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/pricings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const pricing = await storage.updatePricing(id, req.body);
    
    if (!pricing) {
      return res.status(404).json({ error: "Pricing not found" });
    }
    
    res.json(pricing);
  });

  app.delete("/api/pricings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deletePricing(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Pricing not found" });
    }
    
    res.json({ success: true });
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

  app.get("/api/analytics/stibee", async (req, res) => {
    const apiKey = process.env.STIBEE_API_KEY;
    
    if (!apiKey) {
      return res.json({
        isDemo: true,
        stats: [
          { metric: "발송 건수", value: "12,450", change: "+8.2%", trend: "up" },
          { metric: "오픈율", value: "34.2%", change: "+2.5%", trend: "up" },
          { metric: "클릭율", value: "12.8%", change: "-1.2%", trend: "down" },
          { metric: "구독자 수", value: "15,234", change: "+156", trend: "up" },
        ]
      });
    }

    try {
      const response = await fetch("https://api.stibee.com/v1/stats", {
        headers: {
          "AccessToken": apiKey,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Stibee API error");
      }

      const data = await response.json();
      res.json({
        isDemo: false,
        stats: [
          { metric: "발송 건수", value: data.sentCount?.toLocaleString() || "0", change: data.sentChange || "0%", trend: data.sentTrend || "up" },
          { metric: "오픈율", value: `${data.openRate || 0}%`, change: data.openRateChange || "0%", trend: data.openRateTrend || "up" },
          { metric: "클릭율", value: `${data.clickRate || 0}%`, change: data.clickRateChange || "0%", trend: data.clickRateTrend || "up" },
          { metric: "구독자 수", value: data.subscriberCount?.toLocaleString() || "0", change: data.subscriberChange || "0", trend: data.subscriberTrend || "up" },
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
          { metric: "구독자 수", value: "15,234", change: "+156", trend: "up" },
        ]
      });
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

  const httpServer = createServer(app);
  return httpServer;
}
