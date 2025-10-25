import type { 
  Advertiser, 
  InsertAdvertiser,
  Contact,
  InsertContact,
  Memo,
  InsertMemo,
  AdSlot,
  InsertAdSlot,
  AdMaterial,
  InsertAdMaterial,
  Quote,
  InsertQuote,
  Material,
  InsertMaterial,
  Pricing,
  InsertPricing
} from "@shared/schema";

export interface IStorage {
  getAdvertisers(): Promise<Advertiser[]>;
  getAdvertiserById(id: number): Promise<Advertiser | undefined>;
  createAdvertiser(data: InsertAdvertiser): Promise<Advertiser>;
  updateAdvertiser(id: number, data: Partial<InsertAdvertiser>): Promise<Advertiser | undefined>;
  deleteAdvertiser(id: number): Promise<boolean>;
  
  getContactsByAdvertiserId(advertiserId: number): Promise<Contact[]>;
  createContact(data: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
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
  
  getPricings(): Promise<Pricing[]>;
  getPricingByKey(productKey: string): Promise<Pricing | undefined>;
  createPricing(data: InsertPricing): Promise<Pricing>;
  updatePricing(id: number, data: Partial<InsertPricing>): Promise<Pricing | undefined>;
  deletePricing(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private advertisers: Advertiser[] = [];
  private contacts: Contact[] = [];
  private memos: Memo[] = [];
  private adSlots: AdSlot[] = [];
  private adMaterials: AdMaterial[] = [];
  private quotes: Quote[] = [];
  private materials: Material[] = [];
  private pricings: Pricing[] = [];
  
  private nextAdvertiserId = 1;
  private nextContactId = 1;
  private nextMemoId = 1;
  private nextAdSlotId = 1;
  private nextAdMaterialId = 1;
  private nextQuoteId = 1;
  private nextMaterialId = 1;
  private nextPricingId = 1;

  constructor() {
    this.initializeDefaultPricings();
    this.initializeTestData();
  }

  private initializeDefaultPricings() {
    const defaultPricings: InsertPricing[] = [
      { productName: "메인 배너", productKey: "main_banner", price: "2400000", specs: "PC: 1900×400px, Mobile: 720×520px, 총 4주 운영", description: "매달 240만원" },
      { productName: "사이드 배너 1", productKey: "side_banner_1", price: "2400000", specs: "600×300px, 로고만 운영", description: "매달 240만원" },
      { productName: "사이드 배너 2", productKey: "side_banner_2", price: "1500000", specs: "300×250px", description: "매달 150만원" },
      { productName: "사이드 배너 3", productKey: "side_banner_3", price: "750000", specs: "300×250px, 위드배너", description: "총액 75만원" },
      { productName: "뉴스레터 TOP 배너", productKey: "newsletter_top", price: "500000", specs: "5,200명 구독자, 섹션 배치", description: "50만원" },
      { productName: "뉴스레터 MIDDLE 배너", productKey: "newsletter_middle", price: "400000", specs: "로고만 굵은 배치", description: "40만원" },
      { productName: "뉴스레터 BOTTOM 배너", productKey: "newsletter_bottom", price: "300000", specs: "텍스트 배치", description: "30만원" },
      { productName: "뉴스레터 이벤트광고", productKey: "newsletter_event", price: "800000", specs: "뉴스레터 내 기사 형식", description: "80만원" },
      { productName: "뉴스레터 eDM", productKey: "newsletter_edm", price: "1200000", specs: "뉴스레터 eDM", description: "120만원" },
    ];

    defaultPricings.forEach(pricing => {
      this.pricings.push({
        id: this.nextPricingId++,
        productName: pricing.productName,
        productKey: pricing.productKey,
        price: pricing.price,
        specs: pricing.specs || null,
        description: pricing.description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  private initializeTestData() {
    const testAdvertisers = [
      { name: "테크스타트업", businessNumber: "123-45-67890", ceoName: "김대표", status: "집행중", inquiryDate: "2024-01-15", amount: "2400000" },
      { name: "이커머스컴퍼니", businessNumber: "234-56-78901", ceoName: "이대표", status: "부킹확정", inquiryDate: "2024-02-01", amount: "1500000" },
      { name: "핀테크솔루션", businessNumber: "345-67-89012", ceoName: "박대표", status: "문의중", inquiryDate: "2024-02-10", amount: null },
      { name: "AI플랫폼", businessNumber: "456-78-90123", ceoName: "최대표", status: "견적제시", inquiryDate: "2024-02-15", amount: "2400000" },
      { name: "헬스케어스타트업", businessNumber: "567-89-01234", ceoName: "정대표", status: "집행중", inquiryDate: "2024-01-20", amount: "3900000" },
    ];

    const testContacts = [
      { name: "김담당", email: "kim@techstartup.com", phone: "010-1234-5678", position: "마케팅팀장", isPrimary: true },
      { name: "이담당", email: "lee@ecommerce.com", phone: "010-2345-6789", position: "홍보팀장", isPrimary: true },
      { name: "박담당", email: "park@fintech.com", phone: "010-3456-7890", position: "사업개발", isPrimary: true },
      { name: "최담당", email: "choi@aiplatform.com", phone: "010-4567-8901", position: "마케팅매니저", isPrimary: true },
      { name: "정담당", email: "jung@healthcare.com", phone: "010-5678-9012", position: "광고담당", isPrimary: true },
    ];

    testAdvertisers.forEach((data, index) => {
      const advertiser: Advertiser = {
        id: this.nextAdvertiserId++,
        name: data.name,
        businessNumber: data.businessNumber,
        ceoName: data.ceoName,
        status: data.status,
        inquiryDate: data.inquiryDate,
        amount: data.amount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.advertisers.push(advertiser);

      const contact: Contact = {
        id: this.nextContactId++,
        advertiserId: advertiser.id,
        name: testContacts[index].name,
        email: testContacts[index].email,
        phone: testContacts[index].phone,
        position: testContacts[index].position,
        isPrimary: testContacts[index].isPrimary,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.contacts.push(contact);
    });
  }

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
    this.contacts = this.contacts.filter(c => c.advertiserId !== id);
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

  async getContactsByAdvertiserId(advertiserId: number): Promise<Contact[]> {
    return this.contacts.filter(c => c.advertiserId === advertiserId);
  }

  async createContact(data: InsertContact): Promise<Contact> {
    const contact: Contact = {
      id: this.nextContactId++,
      advertiserId: data.advertiserId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position || null,
      isPrimary: data.isPrimary || false,
      createdAt: new Date(),
    };
    this.contacts.push(contact);
    return contact;
  }

  async updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined> {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    this.contacts[index] = {
      ...this.contacts[index],
      ...data,
    };
    return this.contacts[index];
  }

  async deleteContact(id: number): Promise<boolean> {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.contacts.splice(index, 1);
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

  async getPricings(): Promise<Pricing[]> {
    return this.pricings;
  }

  async getPricingByKey(productKey: string): Promise<Pricing | undefined> {
    return this.pricings.find(p => p.productKey === productKey);
  }

  async createPricing(data: InsertPricing): Promise<Pricing> {
    const pricing: Pricing = {
      id: this.nextPricingId++,
      productName: data.productName,
      productKey: data.productKey,
      price: data.price,
      specs: data.specs || null,
      description: data.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pricings.push(pricing);
    return pricing;
  }

  async updatePricing(id: number, data: Partial<InsertPricing>): Promise<Pricing | undefined> {
    const index = this.pricings.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.pricings[index] = {
      ...this.pricings[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.pricings[index];
  }

  async deletePricing(id: number): Promise<boolean> {
    const index = this.pricings.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.pricings.splice(index, 1);
    return true;
  }
}

export const storage = new MemStorage();
