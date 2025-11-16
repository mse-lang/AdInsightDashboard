import { base, TABLES } from '../client';
import type { QuoteItemFields, AirtableRecordType } from '../types';

export type QuoteItemRecord = AirtableRecordType<QuoteItemFields>;

// Get quote items by quote ID
export async function getQuoteItemsByQuote(quoteId: string): Promise<QuoteItemRecord[]> {
  if (!base) {
    console.warn('[Airtable] getQuoteItemsByQuote called but Airtable not configured');
    return [];
  }

  try {
    const formula = `SEARCH('${quoteId}', ARRAYJOIN({Quote}))`;

    const records = await base(TABLES.QUOTE_ITEMS)
      .select({
        filterByFormula: formula,
      })
      .all();

    return records as unknown as QuoteItemRecord[];
  } catch (error) {
    console.error('Error fetching quote items by quote:', error);
    throw error;
  }
}

// Get quote item by ID
export async function getQuoteItemById(recordId: string): Promise<QuoteItemRecord | null> {
  if (!base) {
    console.warn('[Airtable] getQuoteItemById called but Airtable not configured');
    return null;
  }

  try {
    const record = await base(TABLES.QUOTE_ITEMS).find(recordId);
    return record as unknown as QuoteItemRecord;
  } catch (error) {
    console.error('Error fetching quote item by ID:', error);
    return null;
  }
}

// Create quote item
export async function createQuoteItem(data: {
  quoteId: string;
  adProductId: string;
  quantity: number;
  unitPrice: number;
  duration?: number;
}): Promise<QuoteItemRecord> {
  if (!base) {
    throw new Error('Cannot create quote item: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!data.quoteId) {
    throw new Error('Quote ID is required');
  }

  if (!data.adProductId) {
    throw new Error('Ad Product ID is required');
  }

  if (data.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  if (data.unitPrice < 0) {
    throw new Error('Unit price cannot be negative');
  }

  try {
    const fields: Partial<QuoteItemFields> = {
      'Quote': [data.quoteId],
      'Ad Product': [data.adProductId],
      'Quantity': data.quantity,
      'Unit Price': data.unitPrice,
    };

    if (data.duration) fields['Duration'] = data.duration;

    const record = await base(TABLES.QUOTE_ITEMS).create(fields);
    return record as unknown as QuoteItemRecord;
  } catch (error) {
    console.error('Error creating quote item:', error);
    throw error;
  }
}

// Update quote item
export async function updateQuoteItem(
  recordId: string,
  data: Partial<{
    adProductId: string;
    quantity: number;
    unitPrice: number;
    duration: number;
  }>
): Promise<QuoteItemRecord> {
  if (!base) {
    throw new Error('Cannot update quote item: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Quote item ID is required');
  }

  if (data.quantity !== undefined && data.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  if (data.unitPrice !== undefined && data.unitPrice < 0) {
    throw new Error('Unit price cannot be negative');
  }

  try {
    const fields: Partial<QuoteItemFields> = {};

    if (data.adProductId) fields['Ad Product'] = [data.adProductId];
    if (data.quantity !== undefined) fields['Quantity'] = data.quantity;
    if (data.unitPrice !== undefined) fields['Unit Price'] = data.unitPrice;
    if (data.duration !== undefined) fields['Duration'] = data.duration;

    if (Object.keys(fields).length === 0) {
      throw new Error('No fields to update');
    }

    const record = await base(TABLES.QUOTE_ITEMS).update(recordId, fields);
    
    if (!record) {
      throw new Error('Quote item not found or update failed');
    }
    
    return record as unknown as QuoteItemRecord;
  } catch (error) {
    console.error('Error updating quote item:', error);
    throw error;
  }
}

// Delete quote item (hard delete)
export async function deleteQuoteItem(recordId: string): Promise<boolean> {
  if (!base) {
    throw new Error('Cannot delete quote item: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Quote item ID is required');
  }

  try {
    await base(TABLES.QUOTE_ITEMS).destroy(recordId);
    return true;
  } catch (error) {
    console.error('Error deleting quote item:', error);
    throw error;
  }
}

// Bulk create quote items
export async function bulkCreateQuoteItems(
  items: Array<{
    quoteId: string;
    adProductId: string;
    quantity: number;
    unitPrice: number;
    duration?: number;
  }>
): Promise<QuoteItemRecord[]> {
  if (!base) {
    throw new Error('Cannot create quote items: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!items || items.length === 0) {
    throw new Error('No items provided');
  }

  try {
    const fields = items.map(item => {
      if (!item.quoteId || !item.adProductId) {
        throw new Error('Quote ID and Ad Product ID are required for all items');
      }
      if (item.quantity <= 0) {
        throw new Error('Quantity must be greater than 0 for all items');
      }
      if (item.unitPrice < 0) {
        throw new Error('Unit price cannot be negative for all items');
      }

      const itemFields: Partial<QuoteItemFields> = {
        'Quote': [item.quoteId],
        'Ad Product': [item.adProductId],
        'Quantity': item.quantity,
        'Unit Price': item.unitPrice,
      };

      if (item.duration) itemFields['Duration'] = item.duration;

      return { fields: itemFields };
    });

    const records = await base(TABLES.QUOTE_ITEMS).create(fields);
    return records as unknown as QuoteItemRecord[];
  } catch (error) {
    console.error('Error bulk creating quote items:', error);
    throw error;
  }
}
