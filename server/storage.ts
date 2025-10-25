import type { 
  Advertiser, 
  InsertAdvertiser,
  Memo,
  InsertMemo,
  AdSlot,
  InsertAdSlot,
  AdMaterial,
  InsertAdMaterial,
  Quote,
  InsertQuote,
  Material,
  InsertMaterial
} from "@shared/schema";

export interface IStorage {
  getAdvertisers(): Promise<Advertiser[]>;
  getAdvertiserById(id: number): Promise<Advertiser | undefined>;
  createAdvertiser(data: InsertAdvertiser): Promise<Advertiser>;
  updateAdvertiser(id: number, data: Partial<InsertAdvertiser>): Promise<Advertiser | undefined>;
  deleteAdvertiser(id: number): Promise<boolean>;
  
  getMemosByAdvertiserId(advertiserId: number): Promise<Memo[]>;
  createMemo(data: InsertMemo): Promise<Memo>;
  deleteMemo(id: number): Promise<boolean>;
  
  getAdSlots(): Promise<AdSlot[]>;
  getAdSlotById(id: number): Promise<AdSlot | undefined>;
  createAdSlot(data: InsertAdSlot): Promise<AdSlot>;
  
  getAdMaterials(): Promise<AdMaterial[]>;
  getAdMaterialsByAdvertiserId(advertiserId: number): Promise<AdMaterial[]>;
  getAdMaterialsBySlotId(slotId: number): Promise<AdMaterial[]>;
  createAdMaterial(data: InsertAdMaterial): Promise<AdMaterial>;
  updateAdMaterial(id: number, data: Partial<InsertAdMaterial>): Promise<AdMaterial | undefined>;
  deleteAdMaterial(id: number): Promise<boolean>;
  
  getQuotes(): Promise<Quote[]>;
  getQuotesByAdvertiserId(advertiserId: number): Promise<Quote[]>;
  createQuote(data: InsertQuote): Promise<Quote>;
  
  getMaterials(): Promise<Material[]>;
  createMaterial(data: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, data: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private advertisers: Advertiser[] = [];
  private memos: Memo[] = [];
  private adSlots: AdSlot[] = [];
  private adMaterials: AdMaterial[] = [];
  private quotes: Quote[] = [];
  private materials: Material[] = [];
  
  private nextAdvertiserId = 1;
  private nextMemoId = 1;
  private nextAdSlotId = 1;
  private nextAdMaterialId = 1;
  private nextQuoteId = 1;
  private nextMaterialId = 1;

  async getAdvertisers(): Promise<Advertiser[]> {
    return this.advertisers;
  }

  async getAdvertiserById(id: number): Promise<Advertiser | undefined> {
    return this.advertisers.find(a => a.id === id);
  }

  async createAdvertiser(data: InsertAdvertiser): Promise<Advertiser> {
    const advertiser: Advertiser = {
      id: this.nextAdvertiserId++,
      name: data.name,
      contact: data.contact,
      email: data.email,
      businessNumber: data.businessNumber || null,
      ceoName: data.ceoName || null,
      status: data.status || "문의중",
      amount: data.amount || null,
      inquiryDate: data.inquiryDate,
      businessRegFile: data.businessRegFile || null,
      bankAccountFile: data.bankAccountFile || null,
      logoFile: data.logoFile || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.advertisers.push(advertiser);
    return advertiser;
  }

  async updateAdvertiser(id: number, data: Partial<InsertAdvertiser>): Promise<Advertiser | undefined> {
    const index = this.advertisers.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.advertisers[index] = {
      ...this.advertisers[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.advertisers[index];
  }

  async deleteAdvertiser(id: number): Promise<boolean> {
    const index = this.advertisers.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.advertisers.splice(index, 1);
    return true;
  }

  async getMemosByAdvertiserId(advertiserId: number): Promise<Memo[]> {
    return this.memos.filter(m => m.advertiserId === advertiserId);
  }

  async createMemo(data: InsertMemo): Promise<Memo> {
    const memo: Memo = {
      id: this.nextMemoId++,
      advertiserId: data.advertiserId,
      content: data.content,
      files: data.files || null,
      createdAt: new Date(),
    };
    this.memos.push(memo);
    return memo;
  }

  async deleteMemo(id: number): Promise<boolean> {
    const index = this.memos.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.memos.splice(index, 1);
    return true;
  }

  async getAdSlots(): Promise<AdSlot[]> {
    return this.adSlots;
  }

  async getAdSlotById(id: number): Promise<AdSlot | undefined> {
    return this.adSlots.find(s => s.id === id);
  }

  async createAdSlot(data: InsertAdSlot): Promise<AdSlot> {
    const slot: AdSlot = {
      id: this.nextAdSlotId++,
      name: data.name,
      type: data.type,
      maxSlots: data.maxSlots,
      price: data.price,
      description: data.description || null,
      createdAt: new Date(),
    };
    this.adSlots.push(slot);
    return slot;
  }

  async getAdMaterials(): Promise<AdMaterial[]> {
    return this.adMaterials;
  }

  async getAdMaterialsByAdvertiserId(advertiserId: number): Promise<AdMaterial[]> {
    return this.adMaterials.filter(m => m.advertiserId === advertiserId);
  }

  async getAdMaterialsBySlotId(slotId: number): Promise<AdMaterial[]> {
    return this.adMaterials.filter(m => m.slotId === slotId);
  }

  async createAdMaterial(data: InsertAdMaterial): Promise<AdMaterial> {
    const material: AdMaterial = {
      id: this.nextAdMaterialId++,
      advertiserId: data.advertiserId,
      slotId: data.slotId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      startDate: data.startDate,
      endDate: data.endDate,
      amount: data.amount,
      status: data.status || "예정",
      createdAt: new Date(),
    };
    this.adMaterials.push(material);
    return material;
  }

  async updateAdMaterial(id: number, data: Partial<InsertAdMaterial>): Promise<AdMaterial | undefined> {
    const index = this.adMaterials.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    
    this.adMaterials[index] = {
      ...this.adMaterials[index],
      ...data,
    };
    return this.adMaterials[index];
  }

  async deleteAdMaterial(id: number): Promise<boolean> {
    const index = this.adMaterials.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.adMaterials.splice(index, 1);
    return true;
  }

  async getQuotes(): Promise<Quote[]> {
    return this.quotes;
  }

  async getQuotesByAdvertiserId(advertiserId: number): Promise<Quote[]> {
    return this.quotes.filter(q => q.advertiserId === advertiserId);
  }

  async createQuote(data: InsertQuote): Promise<Quote> {
    const quote: Quote = {
      id: this.nextQuoteId++,
      quoteNumber: data.quoteNumber,
      advertiserId: data.advertiserId,
      issueDate: data.issueDate,
      product: data.product,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      notes: data.notes || null,
      status: data.status || "발송완료",
      createdAt: new Date(),
    };
    this.quotes.push(quote);
    return quote;
  }

  async getMaterials(): Promise<Material[]> {
    return this.materials;
  }

  async createMaterial(data: InsertMaterial): Promise<Material> {
    const material: Material = {
      id: this.nextMaterialId++,
      name: data.name,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      isValid: data.isValid || false,
      uploadDate: data.uploadDate,
      createdAt: new Date(),
    };
    this.materials.push(material);
    return material;
  }

  async updateMaterial(id: number, data: Partial<InsertMaterial>): Promise<Material | undefined> {
    const index = this.materials.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    
    this.materials[index] = {
      ...this.materials[index],
      ...data,
    };
    return this.materials[index];
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const index = this.materials.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.materials.splice(index, 1);
    return true;
  }
}

export const storage = new MemStorage();
