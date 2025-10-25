import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const advertisers = pgTable("advertisers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  email: text("email").notNull(),
  businessNumber: text("business_number"),
  ceoName: text("ceo_name"),
  status: text("status").notNull().default("문의중"),
  amount: text("amount"),
  inquiryDate: text("inquiry_date").notNull(),
  businessRegFile: text("business_reg_file"),
  bankAccountFile: text("bank_account_file"),
  logoFile: text("logo_file"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdvertiserSchema = createInsertSchema(advertisers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdvertiser = z.infer<typeof insertAdvertiserSchema>;
export type Advertiser = typeof advertisers.$inferSelect;

export const memos = pgTable("memos", {
  id: serial("id").primaryKey(),
  advertiserId: integer("advertiser_id").notNull().references(() => advertisers.id),
  content: text("content").notNull(),
  files: text("files").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMemoSchema = createInsertSchema(memos).omit({
  id: true,
  createdAt: true,
});

export type InsertMemo = z.infer<typeof insertMemoSchema>;
export type Memo = typeof memos.$inferSelect;

export const adSlots = pgTable("ad_slots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  maxSlots: integer("max_slots").notNull(),
  price: text("price").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdSlotSchema = createInsertSchema(adSlots).omit({
  id: true,
  createdAt: true,
});

export type InsertAdSlot = z.infer<typeof insertAdSlotSchema>;
export type AdSlot = typeof adSlots.$inferSelect;

export const adMaterials = pgTable("ad_materials", {
  id: serial("id").primaryKey(),
  advertiserId: integer("advertiser_id").notNull().references(() => advertisers.id),
  slotId: integer("slot_id").notNull().references(() => adSlots.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  amount: text("amount").notNull(),
  status: text("status").notNull().default("예정"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdMaterialSchema = createInsertSchema(adMaterials).omit({
  id: true,
  createdAt: true,
});

export type InsertAdMaterial = z.infer<typeof insertAdMaterialSchema>;
export type AdMaterial = typeof adMaterials.$inferSelect;

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").notNull().unique(),
  advertiserId: integer("advertiser_id").notNull().references(() => advertisers.id),
  issueDate: text("issue_date").notNull(),
  product: text("product").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: text("unit_price").notNull(),
  subtotal: text("subtotal").notNull(),
  tax: text("tax").notNull(),
  total: text("total").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("발송완료"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: text("file_size").notNull(),
  isValid: boolean("is_valid").notNull().default(false),
  uploadDate: text("upload_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

export const pricings = pgTable("pricings", {
  id: serial("id").primaryKey(),
  productName: text("product_name").notNull().unique(),
  productKey: text("product_key").notNull().unique(),
  price: text("price").notNull(),
  specs: text("specs"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPricingSchema = createInsertSchema(pricings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPricing = z.infer<typeof insertPricingSchema>;
export type Pricing = typeof pricings.$inferSelect;
