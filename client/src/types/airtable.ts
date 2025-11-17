export interface AirtableAgency {
  id: string;
  name: string;
  businessRegistrationNumber?: string;
  contactPerson: string;
  email: string;
  phone: string;
  bankName?: string;
  bankAccountNumber?: string;
  status: 'Active' | 'Inactive';
  notes?: string;
}

export interface AirtableAdvertiser {
  id: string;
  companyName: string;
  businessNumber?: string;
  businessRegistrationNumber?: string;
  bankAccountNumber?: string;
  adMaterials?: string;
  contactPerson: string;
  contactPersonType: 'Advertiser' | 'Agency';
  agencyId?: string | null;
  agencyName?: string; // Lookup field
  email: string;
  phone: string;
  industry?: string;
  status: 'Lead' | 'Active' | 'Inactive';
  accountManager?: string | null;
  campaigns?: string[]; // Campaign IDs
}

export interface CommunicationLog {
  id: string;
  type: 'Email' | 'SMS' | 'KakaoTalk' | 'Inbound Email';
  subject?: string;
  content: string;
  status: 'Sent' | 'Failed' | 'Delivered' | 'Read';
  sentAt?: string;
  externalId?: string;
}

export interface AirtableQuote {
  id: string;
  quoteNumber: number;
  advertiserId: string | null;
  totalAmount: number;
  discountRate: number;
  finalAmount: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
  pdfUrl?: string;
  sentAt?: string | null;
}

export interface AirtableAdProduct {
  id: string;
  productName: string;
  description?: string;
  format: 'Banner' | 'Newsletter' | 'Native' | 'Video';
  dimensions?: string;
  position?: string;
  unitPrice: number;
  status: 'Active' | 'Inactive';
}

export interface QuoteItem {
  id: string;
  quoteId: string | null;
  adProductId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  duration?: number | null;
}

export interface AirtableInvoice {
  id: string;
  invoiceNumber: number;
  quoteId: string | null;
  advertiserId: string | null;
  amount: number;
  status: 'Pending' | 'Issued' | 'Paid' | 'Overdue';
  issueDate?: string | null;
  dueDate?: string | null;
  paymentDate?: string | null;
  notes?: string;
}

export interface AirtableCampaign {
  id: string;
  campaignName: string;
  advertiserId: string | null;
  adProductIds: string[];
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Cancelled';
  utmCampaign?: string;
  googleCalendarId?: string;
  creativeIds: string[];
  reportIds: string[];
}
