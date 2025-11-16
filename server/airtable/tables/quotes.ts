import { base, TABLES } from '../client';
import type { QuoteFields, AirtableRecordType } from '../types';

export type QuoteRecord = AirtableRecordType<QuoteFields>;

// Get all quotes
export async function getAllQuotes(): Promise<QuoteRecord[]> {
  if (!base) {
    console.warn('[Airtable] getAllQuotes called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.QUOTES)
      .select({
        // Note: Quote Number is autoNumber and may not be available yet
        // Sorting by Status for now
      })
      .all();

    return records as unknown as QuoteRecord[];
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }
}

// Get quote by ID
export async function getQuoteById(recordId: string): Promise<QuoteRecord | null> {
  if (!base) {
    console.warn('[Airtable] getQuoteById called but Airtable not configured');
    return null;
  }

  try {
    const record = await base(TABLES.QUOTES).find(recordId);
    return record as unknown as QuoteRecord;
  } catch (error) {
    console.error('Error fetching quote by ID:', error);
    return null;
  }
}

// Get quotes by advertiser
export async function getQuotesByAdvertiser(advertiserId: string): Promise<QuoteRecord[]> {
  if (!base) {
    console.warn('[Airtable] getQuotesByAdvertiser called but Airtable not configured');
    return [];
  }

  try {
    const formula = `SEARCH('${advertiserId}', ARRAYJOIN({Advertiser}))`;

    const records = await base(TABLES.QUOTES)
      .select({
        filterByFormula: formula,
        // Note: Quote Number is autoNumber and may not be available yet
      })
      .all();

    return records as unknown as QuoteRecord[];
  } catch (error) {
    console.error('Error fetching quotes by advertiser:', error);
    throw error;
  }
}

// Get quotes by status
export async function getQuotesByStatus(
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected'
): Promise<QuoteRecord[]> {
  if (!base) {
    console.warn('[Airtable] getQuotesByStatus called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.QUOTES)
      .select({
        filterByFormula: `{Status} = '${status}'`,
        // Note: Quote Number is autoNumber and may not be available yet
      })
      .all();

    return records as unknown as QuoteRecord[];
  } catch (error) {
    console.error('Error fetching quotes by status:', error);
    throw error;
  }
}

// Create quote
export async function createQuote(data: {
  advertiserId: string;
  totalAmount: number;
  discountRate?: number;
  status?: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
  pdfUrl?: string;
}): Promise<QuoteRecord> {
  if (!base) {
    throw new Error('Cannot create quote: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!data.advertiserId) {
    throw new Error('Advertiser ID is required');
  }

  try {
    const fields: Partial<QuoteFields> = {
      'Advertiser': [data.advertiserId],
      'Total Amount': data.totalAmount,
      'Status': data.status || 'Draft',
    };

    if (data.discountRate !== undefined) fields['Discount Rate'] = data.discountRate;
    if (data.pdfUrl) fields['PDF URL'] = data.pdfUrl;

    const record = await base(TABLES.QUOTES).create(fields);
    return record as unknown as QuoteRecord;
  } catch (error) {
    console.error('Error creating quote:', error);
    throw error;
  }
}

// Update quote
export async function updateQuote(
  recordId: string,
  data: Partial<{
    totalAmount: number;
    discountRate: number;
    status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
    pdfUrl: string;
    sentAt: string;
  }>
): Promise<QuoteRecord> {
  if (!base) {
    throw new Error('Cannot update quote: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Quote ID is required');
  }

  try {
    const fields: Partial<QuoteFields> = {};

    if (data.totalAmount !== undefined) fields['Total Amount'] = data.totalAmount;
    if (data.discountRate !== undefined) fields['Discount Rate'] = data.discountRate;
    if (data.status) fields['Status'] = data.status;
    if (data.pdfUrl) fields['PDF URL'] = data.pdfUrl;
    if (data.sentAt) fields['Sent At'] = data.sentAt;

    if (Object.keys(fields).length === 0) {
      throw new Error('No fields to update');
    }

    const record = await base(TABLES.QUOTES).update(recordId, fields);
    
    if (!record) {
      throw new Error('Quote not found or update failed');
    }
    
    return record as unknown as QuoteRecord;
  } catch (error) {
    console.error('Error updating quote:', error);
    throw error;
  }
}

// Delete quote (soft delete by setting status to Rejected)
export async function deleteQuote(recordId: string): Promise<boolean> {
  if (!base) {
    throw new Error('Cannot delete quote: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Quote ID is required');
  }

  try {
    const record = await base(TABLES.QUOTES).update(recordId, {
      'Status': 'Rejected',
    });
    
    if (!record) {
      throw new Error('Quote not found or delete failed');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }
}

// Send quote (update status to Sent and set Sent At)
export async function sendQuote(recordId: string): Promise<QuoteRecord> {
  if (!base) {
    throw new Error('Cannot send quote: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Quote ID is required');
  }

  try {
    const record = await base(TABLES.QUOTES).update(recordId, {
      'Status': 'Sent',
      'Sent At': new Date().toISOString(),
    });
    
    if (!record) {
      throw new Error('Quote not found or send failed');
    }
    
    return record as unknown as QuoteRecord;
  } catch (error) {
    console.error('Error sending quote:', error);
    throw error;
  }
}

// Approve quote
export async function approveQuote(recordId: string): Promise<QuoteRecord> {
  if (!base) {
    throw new Error('Cannot approve quote: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Quote ID is required');
  }

  try {
    const record = await base(TABLES.QUOTES).update(recordId, {
      'Status': 'Approved',
    });
    
    if (!record) {
      throw new Error('Quote not found or approval failed');
    }
    
    return record as unknown as QuoteRecord;
  } catch (error) {
    console.error('Error approving quote:', error);
    throw error;
  }
}
