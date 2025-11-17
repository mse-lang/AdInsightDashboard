#!/usr/bin/env tsx
/**
 * Airtable Connection Test Script
 * 
 * This script tests the connection to Airtable and verifies that all required tables exist.
 * 
 * Usage:
 *   npm run test:airtable
 * 
 * Environment variables required:
 *   - AIRTABLE_API_KEY
 *   - AIRTABLE_BASE_ID
 */

import 'dotenv/config';
import { base, TABLES, AIRTABLE_ENABLED } from '../server/airtable/client';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logHeader(message: string) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`  ${message}`, colors.bright + colors.blue);
  log(`${'='.repeat(60)}`, colors.blue);
}

async function testTableAccess(tableName: string): Promise<boolean> {
  if (!base) {
    logError(`Base is not initialized`);
    return false;
  }

  try {
    const records = await base(tableName)
      .select({
        maxRecords: 1,
        view: 'Grid view', // Default view
      })
      .firstPage();
    
    logSuccess(`${tableName.padEnd(25)} - ${records.length} record(s) found`);
    return true;
  } catch (error: any) {
    if (error.statusCode === 404) {
      logError(`${tableName.padEnd(25)} - Table not found`);
    } else if (error.statusCode === 401) {
      logError(`${tableName.padEnd(25)} - Authentication failed`);
    } else if (error.statusCode === 403) {
      logError(`${tableName.padEnd(25)} - Permission denied`);
    } else {
      logError(`${tableName.padEnd(25)} - ${error.message}`);
    }
    return false;
  }
}

async function main() {
  logHeader('Airtable Connection Test');
  
  // Check environment variables
  logInfo('Checking environment variables...\n');
  
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  
  if (!apiKey) {
    logError('AIRTABLE_API_KEY is not set');
    process.exit(1);
  } else {
    logSuccess(`AIRTABLE_API_KEY: ${apiKey.substring(0, 8)}...`);
  }
  
  if (!baseId) {
    logError('AIRTABLE_BASE_ID is not set');
    process.exit(1);
  } else {
    logSuccess(`AIRTABLE_BASE_ID: ${baseId}`);
  }
  
  if (!AIRTABLE_ENABLED) {
    logError('Airtable is not enabled (credentials missing)');
    process.exit(1);
  }
  
  logSuccess('Airtable client initialized\n');
  
  // Test all tables
  logHeader('Testing Table Access');
  logInfo('Testing access to all required tables...\n');
  
  const tableTests = Object.entries(TABLES).map(([key, tableName]) => ({
    key,
    tableName,
  }));
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { key, tableName } of tableTests) {
    const success = await testTableAccess(tableName);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  // Summary
  logHeader('Test Summary');
  log(`Total tables tested: ${tableTests.length}`, colors.cyan);
  logSuccess(`Passed: ${successCount}`);
  
  if (failCount > 0) {
    logError(`Failed: ${failCount}`);
    log('\n⚠️  Some tables are missing or inaccessible.', colors.yellow);
    log('Please ensure all required tables exist in your Airtable base:', colors.yellow);
    log('- Users', colors.yellow);
    log('- Agencies', colors.yellow);
    log('- Advertisers', colors.yellow);
    log('- Communication_Logs', colors.yellow);
    log('- Ad_Products', colors.yellow);
    log('- Campaigns', colors.yellow);
    log('- Creatives', colors.yellow);
    log('- Creative_Variants', colors.yellow);
    log('- Quotes', colors.yellow);
    log('- Quote_Items', colors.yellow);
    log('- Invoices', colors.yellow);
    log('- Reports', colors.yellow);
    log('- System_Settings', colors.yellow);
    process.exit(1);
  }
  
  logSuccess('\n🎉 All tests passed! Airtable connection is working correctly.\n');
  process.exit(0);
}

// Run the tests
main().catch((error) => {
  logError(`\nUnexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
