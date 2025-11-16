#!/usr/bin/env tsx
/**
 * Airtable Base Setup Script
 * 
 * This script automatically creates all required tables and fields in your Airtable base
 * according to the VS-AMS schema design.
 * 
 * Prerequisites:
 * 1. Create a new Airtable base manually (name it "VS-AMS Production")
 * 2. Get your Airtable Personal Access Token with schema write permissions
 * 3. Get your Base ID from the URL (starts with "app...")
 * 
 * Usage:
 *   AIRTABLE_API_KEY=pat.xxx AIRTABLE_BASE_ID=appxxx npm run setup:airtable
 */

import axios from 'axios';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   AIRTABLE_API_KEY - Your personal access token');
  console.error('   AIRTABLE_BASE_ID - Your base ID (starts with "app...")');
  console.error('\nUsage:');
  console.error('   AIRTABLE_API_KEY=pat.xxx AIRTABLE_BASE_ID=appxxx npm run setup:airtable');
  process.exit(1);
}

const api = axios.create({
  baseURL: `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}`,
  headers: {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

interface FieldConfig {
  name: string;
  type: string;
  options?: any;
}

interface TableConfig {
  name: string;
  description: string;
  fields: FieldConfig[];
}

const TABLES: TableConfig[] = [
  {
    name: 'Users',
    description: 'User account and permission management',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Email', type: 'email' },
      { name: 'Google UID', type: 'singleLineText' },
      { 
        name: 'Role', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Admin' },
            { name: 'User' },
            { name: 'ReadOnly' }
          ]
        }
      },
      { 
        name: 'Status', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Active' },
            { name: 'Inactive' }
          ]
        }
      },
    ]
  },
  {
    name: 'Advertisers',
    description: 'Client company profiles and contact information',
    fields: [
      { name: 'Company Name', type: 'singleLineText' },
      { name: 'Business Number', type: 'singleLineText' },
      { name: 'Contact Person', type: 'singleLineText' },
      { name: 'Email', type: 'email' },
      { name: 'Phone', type: 'phoneNumber' },
      { 
        name: 'Industry', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Technology' },
            { name: 'Finance' },
            { name: 'Healthcare' },
            { name: 'Education' },
            { name: 'E-commerce' },
            { name: 'Manufacturing' },
            { name: 'Other' }
          ]
        }
      },
      { 
        name: 'Status', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Lead' },
            { name: 'Active' },
            { name: 'Inactive' }
          ]
        }
      },
    ]
  },
  {
    name: 'Communication_Logs',
    description: 'Email, SMS, KakaoTalk communication tracking',
    fields: [
      { 
        name: 'Type', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Email' },
            { name: 'SMS' },
            { name: 'KakaoTalk' },
            { name: 'Inbound Email' }
          ]
        }
      },
      { name: 'Subject', type: 'singleLineText' },
      { name: 'Content', type: 'multilineText' },
      { 
        name: 'Status', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Sent' },
            { name: 'Failed' },
            { name: 'Delivered' },
            { name: 'Read' }
          ]
        }
      },
      { name: 'Sent At', type: 'dateTime' },
      { name: 'External ID', type: 'singleLineText' },
      { name: 'Attachments', type: 'multipleAttachments' },
    ]
  },
  {
    name: 'Ad_Products',
    description: 'Advertising product catalog',
    fields: [
      { name: 'Product Name', type: 'singleLineText' },
      { name: 'Description', type: 'multilineText' },
      { 
        name: 'Format', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Banner' },
            { name: 'Newsletter' },
            { name: 'Native' },
            { name: 'Video' }
          ]
        }
      },
      { name: 'Dimensions', type: 'singleLineText' },
      { name: 'Position', type: 'singleLineText' },
      { name: 'Unit Price', type: 'currency', options: { precision: 0 } },
      { 
        name: 'Status', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Active' },
            { name: 'Inactive' }
          ]
        }
      },
    ]
  },
  {
    name: 'Campaigns',
    description: 'Campaign scheduling and tracking',
    fields: [
      { name: 'Campaign Name', type: 'singleLineText' },
      { name: 'Start Date', type: 'date' },
      { name: 'End Date', type: 'date' },
      { 
        name: 'Status', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Planning' },
            { name: 'Active' },
            { name: 'Completed' },
            { name: 'Cancelled' }
          ]
        }
      },
      { name: 'UTM Campaign', type: 'singleLineText' },
      { name: 'Google Calendar ID', type: 'singleLineText' },
    ]
  },
  {
    name: 'Creatives',
    description: 'Advertising creative asset management',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'File URL', type: 'url' },
      { 
        name: 'File Type', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Image' },
            { name: 'Video' }
          ]
        }
      },
      { 
        name: 'Status', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Pending' },
            { name: 'Approved' },
            { name: 'Rejected' }
          ]
        }
      },
      { name: 'Review Notes', type: 'multilineText' },
    ]
  },
  {
    name: 'Creative_Variants',
    description: 'Dimension-specific converted assets',
    fields: [
      { name: 'Dimensions', type: 'singleLineText' },
      { name: 'File URL', type: 'url' },
    ]
  },
  {
    name: 'Quotes',
    description: 'Quote header information',
    fields: [
      { name: 'Quote Number', type: 'autoNumber' },
      { name: 'Total Amount', type: 'currency', options: { precision: 0 } },
      { name: 'Discount Rate', type: 'percent', options: { precision: 0 } },
      { 
        name: 'Status', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Draft' },
            { name: 'Sent' },
            { name: 'Approved' },
            { name: 'Rejected' }
          ]
        }
      },
      { name: 'PDF URL', type: 'url' },
      { name: 'Sent At', type: 'dateTime' },
    ]
  },
  {
    name: 'Quote_Items',
    description: 'Individual line items in quotes',
    fields: [
      { name: 'Quantity', type: 'number', options: { precision: 0 } },
      { name: 'Unit Price', type: 'currency', options: { precision: 0 } },
      { name: 'Duration', type: 'number', options: { precision: 0 } },
    ]
  },
  {
    name: 'Invoices',
    description: 'Tax invoice tracking',
    fields: [
      { name: 'Invoice Number', type: 'autoNumber' },
      { name: 'Amount', type: 'currency', options: { precision: 0 } },
      { 
        name: 'Status', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Pending' },
            { name: 'Issued' },
            { name: 'Paid' },
            { name: 'Overdue' }
          ]
        }
      },
      { name: 'Issue Date', type: 'date' },
      { name: 'Due Date', type: 'date' },
      { name: 'Payment Date', type: 'date' },
      { name: 'Notes', type: 'multilineText' },
    ]
  },
  {
    name: 'Reports',
    description: 'Performance data and report files',
    fields: [
      { name: 'Report Name', type: 'singleLineText' },
      { name: 'Period Start', type: 'date' },
      { name: 'Period End', type: 'date' },
      { name: 'Impressions', type: 'number', options: { precision: 0 } },
      { name: 'Clicks', type: 'number', options: { precision: 0 } },
      { name: 'Conversions', type: 'number', options: { precision: 0 } },
      { name: 'Report URL', type: 'url' },
      { 
        name: 'Status', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Generating' },
            { name: 'Completed' },
            { name: 'Sent' }
          ]
        }
      },
      { name: 'Sent At', type: 'dateTime' },
    ]
  },
  {
    name: 'System_Settings',
    description: 'API keys, templates, and configuration',
    fields: [
      { 
        name: 'Category', 
        type: 'singleSelect',
        options: {
          choices: [
            { name: 'Solapi' },
            { name: 'Google' },
            { name: 'General' }
          ]
        }
      },
      { name: 'Key', type: 'singleLineText' },
      { name: 'Value', type: 'multilineText' },
      { name: 'Description', type: 'multilineText' },
    ]
  },
];

async function createTable(table: TableConfig) {
  try {
    console.log(`📝 Creating table: ${table.name}...`);
    
    const response = await api.post('/tables', {
      name: table.name,
      description: table.description,
      fields: table.fields,
    });

    console.log(`✅ Created: ${table.name} (${response.data.id})`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      console.error(`❌ Failed to create ${table.name}:`, error.response.data);
    } else {
      console.error(`❌ Failed to create ${table.name}:`, error.message);
    }
    throw error;
  }
}

async function addLinkedFields() {
  console.log('\n🔗 Adding relationship fields...');
  
  // Get all tables to find their IDs
  const tablesResponse = await api.get('/tables');
  const tables = tablesResponse.data.tables;
  
  const tableMap = new Map(tables.map((t: any) => [t.name, t.id]));
  
  const relationships = [
    // Users relationships
    { table: 'Advertisers', field: 'Account Manager', linkedTable: 'Users' },
    { table: 'Communication_Logs', field: 'Sender', linkedTable: 'Users' },
    
    // Advertisers relationships
    { table: 'Communication_Logs', field: 'Advertiser', linkedTable: 'Advertisers' },
    { table: 'Campaigns', field: 'Advertiser', linkedTable: 'Advertisers' },
    { table: 'Quotes', field: 'Advertiser', linkedTable: 'Advertisers' },
    { table: 'Creatives', field: 'Advertiser', linkedTable: 'Advertisers' },
    
    // Campaigns relationships
    { table: 'Creatives', field: 'Campaign', linkedTable: 'Campaigns' },
    { table: 'Reports', field: 'Campaign', linkedTable: 'Campaigns' },
    
    // Ad_Products relationships  
    { table: 'Quote_Items', field: 'Ad Product', linkedTable: 'Ad_Products' },
    
    // Quotes relationships
    { table: 'Quote_Items', field: 'Quote', linkedTable: 'Quotes' },
    { table: 'Invoices', field: 'Quote', linkedTable: 'Quotes' },
    
    // Creatives relationships
    { table: 'Creative_Variants', field: 'Original Creative', linkedTable: 'Creatives' },
  ];
  
  for (const rel of relationships) {
    try {
      const tableId = tableMap.get(rel.table);
      const linkedTableId = tableMap.get(rel.linkedTable);
      
      if (!tableId || !linkedTableId) {
        console.log(`⚠️  Skipping ${rel.field}: Table not found`);
        continue;
      }
      
      console.log(`  Adding ${rel.table}.${rel.field} → ${rel.linkedTable}...`);
      
      await api.post(`/tables/${tableId}/fields`, {
        name: rel.field,
        type: 'multipleRecordLinks',
        options: {
          linkedTableId: linkedTableId,
        },
      });
      
      console.log(`  ✅ Added ${rel.field}`);
    } catch (error: any) {
      console.error(`  ❌ Failed to add ${rel.field}:`, error.response?.data || error.message);
    }
  }
}

async function addFormulaFields() {
  console.log('\n🧮 Adding formula fields...');
  
  const tablesResponse = await api.get('/tables');
  const tables = tablesResponse.data.tables;
  const tableMap = new Map(tables.map((t: any) => [t.name, t.id]));
  
  const formulas = [
    {
      table: 'Quotes',
      field: 'Final Amount',
      formula: '{Total Amount} * (1 - {Discount Rate})',
    },
    {
      table: 'Quote_Items',
      field: 'Subtotal',
      formula: '{Quantity} * {Unit Price}',
    },
    {
      table: 'Reports',
      field: 'CTR',
      formula: 'IF({Impressions} > 0, ({Clicks} / {Impressions}) * 100, 0)',
    },
  ];
  
  for (const formula of formulas) {
    try {
      const tableId = tableMap.get(formula.table);
      if (!tableId) continue;
      
      console.log(`  Adding ${formula.table}.${formula.field}...`);
      
      await api.post(`/tables/${tableId}/fields`, {
        name: formula.field,
        type: 'formula',
        options: {
          formula: formula.formula,
        },
      });
      
      console.log(`  ✅ Added ${formula.field}`);
    } catch (error: any) {
      console.error(`  ❌ Failed to add ${formula.field}:`, error.response?.data || error.message);
    }
  }
}

async function setupAirtableBase() {
  console.log('🚀 VS-AMS Airtable Base Setup');
  console.log('================================\n');
  console.log(`Base ID: ${AIRTABLE_BASE_ID}\n`);
  
  try {
    // Step 1: Create all tables with basic fields
    console.log('Step 1: Creating tables...\n');
    for (const table of TABLES) {
      await createTable(table);
      // Rate limiting: wait 300ms between requests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Step 2: Add linked record fields
    await addLinkedFields();
    
    // Step 3: Add formula fields
    await addFormulaFields();
    
    console.log('\n✅ Airtable base setup complete!');
    console.log('\nNext steps:');
    console.log('1. Visit your Airtable base to verify all tables');
    console.log('2. Add sample data for testing');
    console.log('3. Start the VS-AMS application');
    
  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupAirtableBase();
