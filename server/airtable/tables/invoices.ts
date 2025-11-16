import { base, TABLES } from '../client';
import type { InvoiceFields, AirtableRecordType } from '../types';

export type InvoiceRecord = AirtableRecordType<InvoiceFields>;

// Get all invoices
export async function getAllInvoices(): Promise<InvoiceRecord[]> {
  if (!base) {
    console.warn('[Airtable] getAllInvoices called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.INVOICES)
      .select({
        // Note: Invoice Number is autoNumber and may not be available yet
      })
      .all();

    return records as unknown as InvoiceRecord[];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

// Get invoice by ID
export async function getInvoiceById(recordId: string): Promise<InvoiceRecord | null> {
  if (!base) {
    console.warn('[Airtable] getInvoiceById called but Airtable not configured');
    return null;
  }

  try {
    const record = await base(TABLES.INVOICES).find(recordId);
    return record as unknown as InvoiceRecord;
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    return null;
  }
}

// Get invoices by quote
export async function getInvoicesByQuote(quoteId: string): Promise<InvoiceRecord[]> {
  if (!base) {
    console.warn('[Airtable] getInvoicesByQuote called but Airtable not configured');
    return [];
  }

  try {
    const formula = `SEARCH('${quoteId}', ARRAYJOIN({Quote}))`;

    const records = await base(TABLES.INVOICES)
      .select({
        filterByFormula: formula,
        // Note: Invoice Number is autoNumber and may not be available yet
      })
      .all();

    return records as unknown as InvoiceRecord[];
  } catch (error) {
    console.error('Error fetching invoices by quote:', error);
    throw error;
  }
}

// Get invoices by status
export async function getInvoicesByStatus(
  status: 'Pending' | 'Issued' | 'Paid' | 'Overdue'
): Promise<InvoiceRecord[]> {
  if (!base) {
    console.warn('[Airtable] getInvoicesByStatus called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.INVOICES)
      .select({
        filterByFormula: `{Status} = '${status}'`,
        // Note: Invoice Number is autoNumber and may not be available yet
      })
      .all();

    return records as unknown as InvoiceRecord[];
  } catch (error) {
    console.error('Error fetching invoices by status:', error);
    throw error;
  }
}

// Get overdue invoices
export async function getOverdueInvoices(): Promise<InvoiceRecord[]> {
  if (!base) {
    console.warn('[Airtable] getOverdueInvoices called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.INVOICES)
      .select({
        filterByFormula: `{Status} = 'Overdue'`,
        sort: [{ field: 'Due Date', direction: 'asc' }],
      })
      .all();

    return records as unknown as InvoiceRecord[];
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    throw error;
  }
}

// Create invoice
export async function createInvoice(data: {
  quoteId: string;
  advertiserId?: string;
  amount: number;
  status?: 'Pending' | 'Issued' | 'Paid' | 'Overdue';
  issueDate?: string;
  dueDate?: string;
  notes?: string;
}): Promise<InvoiceRecord> {
  if (!base) {
    throw new Error('Cannot create invoice: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!data.quoteId) {
    throw new Error('Quote ID is required');
  }

  if (data.amount < 0) {
    throw new Error('Amount cannot be negative');
  }

  try {
    const fields: Partial<InvoiceFields> = {
      'Quote': [data.quoteId],
      'Amount': data.amount,
      'Status': data.status || 'Pending',
    };

    // Include advertiser if provided
    if (data.advertiserId) {
      fields['Advertiser'] = [data.advertiserId];
    }

    if (data.issueDate) fields['Issue Date'] = data.issueDate;
    if (data.dueDate) fields['Due Date'] = data.dueDate;
    if (data.notes) fields['Notes'] = data.notes;

    const record = await base(TABLES.INVOICES).create(fields);
    return record as unknown as InvoiceRecord;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

// Update invoice
export async function updateInvoice(
  recordId: string,
  data: Partial<{
    amount: number;
    status: 'Pending' | 'Issued' | 'Paid' | 'Overdue';
    issueDate: string;
    dueDate: string;
    paymentDate: string;
    notes: string;
  }>
): Promise<InvoiceRecord> {
  if (!base) {
    throw new Error('Cannot update invoice: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Invoice ID is required');
  }

  if (data.amount !== undefined && data.amount < 0) {
    throw new Error('Amount cannot be negative');
  }

  try {
    const fields: Partial<InvoiceFields> = {};

    if (data.amount !== undefined) fields['Amount'] = data.amount;
    if (data.status) fields['Status'] = data.status;
    if (data.issueDate) fields['Issue Date'] = data.issueDate;
    if (data.dueDate) fields['Due Date'] = data.dueDate;
    if (data.paymentDate) fields['Payment Date'] = data.paymentDate;
    if (data.notes !== undefined) fields['Notes'] = data.notes;

    if (Object.keys(fields).length === 0) {
      throw new Error('No fields to update');
    }

    const record = await base(TABLES.INVOICES).update(recordId, fields);
    
    if (!record) {
      throw new Error('Invoice not found or update failed');
    }
    
    return record as unknown as InvoiceRecord;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
}

// Delete invoice (hard delete)
export async function deleteInvoice(recordId: string): Promise<boolean> {
  if (!base) {
    throw new Error('Cannot delete invoice: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Invoice ID is required');
  }

  try {
    await base(TABLES.INVOICES).destroy(recordId);
    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

// Issue invoice (update status to Issued and set issue date)
export async function issueInvoice(
  recordId: string,
  issueDate?: string,
  dueDate?: string
): Promise<InvoiceRecord> {
  if (!base) {
    throw new Error('Cannot issue invoice: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Invoice ID is required');
  }

  try {
    const fields: Partial<InvoiceFields> = {
      'Status': 'Issued',
      'Issue Date': issueDate || new Date().toISOString(),
    };

    if (dueDate) fields['Due Date'] = dueDate;

    const record = await base(TABLES.INVOICES).update(recordId, fields);
    
    if (!record) {
      throw new Error('Invoice not found or issue failed');
    }
    
    return record as unknown as InvoiceRecord;
  } catch (error) {
    console.error('Error issuing invoice:', error);
    throw error;
  }
}

// Mark invoice as paid
export async function markAsPaid(
  recordId: string,
  paymentDate?: string
): Promise<InvoiceRecord> {
  if (!base) {
    throw new Error('Cannot mark invoice as paid: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Invoice ID is required');
  }

  try {
    const record = await base(TABLES.INVOICES).update(recordId, {
      'Status': 'Paid',
      'Payment Date': paymentDate || new Date().toISOString(),
    });
    
    if (!record) {
      throw new Error('Invoice not found or payment update failed');
    }
    
    return record as unknown as InvoiceRecord;
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    throw error;
  }
}

// Mark invoice as overdue
export async function markAsOverdue(recordId: string): Promise<InvoiceRecord> {
  if (!base) {
    throw new Error('Cannot mark invoice as overdue: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Invoice ID is required');
  }

  try {
    const record = await base(TABLES.INVOICES).update(recordId, {
      'Status': 'Overdue',
    });
    
    if (!record) {
      throw new Error('Invoice not found or overdue update failed');
    }
    
    return record as unknown as InvoiceRecord;
  } catch (error) {
    console.error('Error marking invoice as overdue:', error);
    throw error;
  }
}
