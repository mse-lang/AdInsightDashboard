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
