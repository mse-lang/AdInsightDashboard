import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export const AIRTABLE_ENABLED = !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);

if (!AIRTABLE_ENABLED) {
  console.warn('⚠️  Airtable credentials not configured. Using in-memory fallback for development.');
  console.warn('   User authentication will work with Google OAuth, but data will not persist.');
  console.warn('   Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID for production use.');
} else {
  // Configure Airtable client only if credentials are available
  Airtable.configure({
    apiKey: AIRTABLE_API_KEY,
  });
}

// Get base instance - only if credentials are configured
export const base = AIRTABLE_ENABLED
  ? Airtable.base(AIRTABLE_BASE_ID!)
  : null;

// Table names
export const TABLES = {
  USERS: 'Users',
  AGENCIES: 'Agencies',
  ADVERTISERS: 'Advertisers',
  COMMUNICATION_LOGS: 'Communication_Logs',
  AD_PRODUCTS: 'Ad_Products',
  CAMPAIGNS: 'Campaigns',
  CREATIVES: 'Creatives',
  CREATIVE_VARIANTS: 'Creative_Variants',
  QUOTES: 'Quotes',
  QUOTE_ITEMS: 'Quote_Items',
  INVOICES: 'Invoices',
  REPORTS: 'Reports',
  SYSTEM_SETTINGS: 'System_Settings',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];

// Helper to check if Airtable is configured
export function isAirtableConfigured(): boolean {
  return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID && base);
}
