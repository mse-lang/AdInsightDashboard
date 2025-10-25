import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAdvertiserSchema, insertMemoSchema, insertQuoteSchema, insertPricingSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
