export interface AirtableAdvertiser {
  id: string;
  companyName: string;
  businessNumber?: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry?: string;
  status: 'Lead' | 'Active' | 'Inactive';
  accountManager?: string | null;
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
