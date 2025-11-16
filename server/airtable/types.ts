import type { FieldSet, Record as AirtableRecord } from 'airtable';
import type { PipelineStatus as SharedPipelineStatus } from '../shared/schema';

// Generic Airtable record type
export type AirtableRecordType<T extends FieldSet> = AirtableRecord<T>;

// Re-export PipelineStatus from shared schema to maintain compatibility
export type PipelineStatus = SharedPipelineStatus;

// User record fields
export interface UserFields extends FieldSet {
  'Name': string;
  'Email': string;
  'Google UID': string;
  'Role': 'Admin' | 'User' | 'ReadOnly';
  'Status': 'Active' | 'Inactive';
}

// Agency record fields (에이전시)
export interface AgencyFields extends FieldSet {
  'Name': string;
  'Business Registration Number'?: string;
  'Contact Person': string;
  'Email': string;
  'Phone': string;
  'Status': 'Active' | 'Inactive';
  'Notes'?: string;
  'Advertisers'?: string[]; // Array of advertiser record IDs
}

// Advertiser record fields
export interface AdvertiserFields extends FieldSet {
  'Company Name': string;
  'Business Number'?: string;
  'Business Registration Number'?: string; // 사업자등록번호
  'Bank Account Number'?: string; // 통장 번호
  'Ad Materials'?: string; // 광고 소재/서비스/제품명 (쉼표 구분)
  'Contact Person': string;
  'Contact Person Type': 'Advertiser' | 'Agency'; // 담당자 소속
  'Agency'?: string[]; // 에이전시 ID (담당자가 Agency인 경우)
  'Email': string;
  'Phone': string;
  'Industry'?: string;
  'Account Manager'?: string[]; // Array of record IDs
  'Status': 'Lead' | 'Active' | 'Inactive';
  'Communication Logs'?: string[];
  'Campaigns'?: string[];
  'Quotes'?: string[];
}

// Communication Log record fields
export interface CommunicationLogFields extends FieldSet {
  'Advertiser': string[]; // Array of record IDs
  'Type': 'Email' | 'SMS' | 'KakaoTalk' | 'Inbound Email';
  'Subject'?: string;
  'Content': string;
  'Sender'?: string[]; // Array of record IDs
  'Status': 'Sent' | 'Failed' | 'Delivered' | 'Read';
  'Sent At'?: string; // ISO date string
  'External ID'?: string;
  'Attachments'?: Array<{
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string;
  }>;
}

// Ad Product record fields
export interface AdProductFields extends FieldSet {
  'Product Name': string;
  'Description'?: string;
  'Format': 'Banner' | 'Newsletter' | 'Native' | 'Video';
  'Dimensions'?: string;
  'Position'?: string;
  'Unit Price': number;
  'Status': 'Active' | 'Inactive';
}

// Campaign record fields
export interface CampaignFields extends FieldSet {
  'Campaign Name': string;
  'Advertiser': string[]; // Array of record IDs
  'Ad Products'?: string[]; // Array of record IDs
  'Start Date': string; // ISO date string
  'End Date': string; // ISO date string
  'Status': 'Planning' | 'Active' | 'Completed' | 'Cancelled';
  'Pipeline Status': PipelineStatus;
  'UTM Campaign'?: string;
  'Google Calendar ID'?: string;
  'Creatives'?: string[];
  'Reports'?: string[];
}

// Creative record fields
export interface CreativeFields extends FieldSet {
  'Name': string;
  'Advertiser': string[]; // Array of record IDs
  'Campaign'?: string[]; // Array of record IDs
  'File URL': string;
  'File Type': 'Image' | 'Video';
  'Status': 'Pending' | 'Approved' | 'Rejected';
  'Review Notes'?: string;
  'Variants'?: string[];
}

// Quote record fields
export interface QuoteFields extends FieldSet {
  'Quote Number': number;
  'Advertiser': string[]; // Array of record IDs
  'Total Amount': number;
  'Discount Rate'?: number;
  'Final Amount'?: number; // Formula field
  'Status': 'Draft' | 'Sent' | 'Approved' | 'Rejected';
  'PDF URL'?: string;
  'Quote Items'?: string[];
  'Invoice'?: string[];
  'Sent At'?: string; // ISO date string
}

// Quote Item record fields
export interface QuoteItemFields extends FieldSet {
  'Quote': string[]; // Array of record IDs
  'Ad Product': string[]; // Array of record IDs
  'Quantity': number;
  'Unit Price': number;
  'Subtotal'?: number; // Formula field
  'Duration'?: number;
}

// Invoice record fields
export interface InvoiceFields extends FieldSet {
  'Invoice Number': number;
  'Quote': string[]; // Array of record IDs
  'Advertiser'?: string[]; // Lookup field
  'Amount': number;
  'Status': 'Pending' | 'Issued' | 'Paid' | 'Overdue';
  'Issue Date'?: string; // ISO date string
  'Due Date'?: string; // ISO date string
  'Payment Date'?: string; // ISO date string
  'Notes'?: string;
}

// Report record fields
export interface ReportFields extends FieldSet {
  'Report Name': string;
  'Campaign': string[]; // Array of record IDs
  'Advertiser'?: string[]; // Lookup field
  'Period Start': string; // ISO date string
  'Period End': string; // ISO date string
  'Impressions'?: number;
  'Clicks'?: number;
  'CTR'?: number; // Formula field
  'Conversions'?: number;
  'Report URL'?: string;
  'Status': 'Generating' | 'Completed' | 'Sent';
  'Sent At'?: string; // ISO date string
}

// System Settings record fields
export interface SystemSettingsFields extends FieldSet {
  'Category': 'Solapi' | 'Google' | 'General';
  'Key': string;
  'Value': string;
  'Description'?: string;
}

// Type guard to check if Airtable is in use
export function isAirtableMode(): boolean {
  return !!(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);
}
