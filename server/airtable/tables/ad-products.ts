import { base, TABLES } from '../client';
import type { AdProductFields } from '../types';
import type { FieldSet } from 'airtable';

export interface AdProductRecord {
  id: string;
  fields: AdProductFields;
  createdTime: string;
}

// Get all ad products
export async function getAllAdProducts(): Promise<AdProductRecord[]> {
  try {
    const records = await base(TABLES.AD_PRODUCTS)
      .select({
        view: 'Grid view',
      })
      .all();
    
    return records as unknown as AdProductRecord[];
  } catch (error) {
    console.error('Error fetching ad products:', error);
    throw error;
  }
}

// Get active ad products only
export async function getActiveAdProducts(): Promise<AdProductRecord[]> {
  try {
    const records = await base(TABLES.AD_PRODUCTS)
      .select({
        view: 'Grid view',
        filterByFormula: "{Status} = 'Active'",
      })
      .all();
    
    return records as unknown as AdProductRecord[];
  } catch (error) {
    console.error('Error fetching active ad products:', error);
    throw error;
  }
}

// Get ad product by ID
export async function getAdProductById(recordId: string): Promise<AdProductRecord | null> {
  try {
    const record = await base(TABLES.AD_PRODUCTS).find(recordId);
    if (!record) return null;
    return record as unknown as AdProductRecord;
  } catch (error) {
    console.error('Error fetching ad product:', error);
    throw error;
  }
}

// Create ad product
export async function createAdProduct(data: {
  productName: string;
  description?: string;
  format: 'Banner' | 'Newsletter' | 'Native' | 'Video';
  dimensions?: string;
  position?: string;
  unitPrice: number;
  status?: 'Active' | 'Inactive';
}): Promise<AdProductRecord> {
  try {
    const fields: Partial<AdProductFields> = {
      'Product Name': data.productName,
      'Format': data.format,
      'Unit Price': data.unitPrice,
      'Status': data.status || 'Active',
    };

    if (data.description) fields['Description'] = data.description;
    if (data.dimensions) fields['Dimensions'] = data.dimensions;
    if (data.position) fields['Position'] = data.position;

    const record = await base(TABLES.AD_PRODUCTS).create(fields as AdProductFields);
    return record as unknown as AdProductRecord;
  } catch (error) {
    console.error('Error creating ad product:', error);
    throw error;
  }
}

// Update ad product
export async function updateAdProduct(
  recordId: string,
  data: {
    productName?: string;
    description?: string;
    format?: 'Banner' | 'Newsletter' | 'Native' | 'Video';
    dimensions?: string;
    position?: string;
    unitPrice?: number;
    status?: 'Active' | 'Inactive';
  }
): Promise<AdProductRecord | null> {
  try {
    const fields: Partial<AdProductFields> = {};

    if (data.productName !== undefined) fields['Product Name'] = data.productName;
    if (data.description !== undefined) fields['Description'] = data.description;
    if (data.format !== undefined) fields['Format'] = data.format;
    if (data.dimensions !== undefined) fields['Dimensions'] = data.dimensions;
    if (data.position !== undefined) fields['Position'] = data.position;
    if (data.unitPrice !== undefined) fields['Unit Price'] = data.unitPrice;
    if (data.status !== undefined) fields['Status'] = data.status;

    if (Object.keys(fields).length === 0) {
      throw new Error('No fields to update');
    }

    const record = await base(TABLES.AD_PRODUCTS).update(recordId, fields as FieldSet);
    return record as unknown as AdProductRecord;
  } catch (error) {
    console.error('Error updating ad product:', error);
    throw error;
  }
}

// Delete ad product (soft delete by setting status to Inactive)
export async function deleteAdProduct(recordId: string): Promise<boolean> {
  try {
    const record = await base(TABLES.AD_PRODUCTS).update(recordId, {
      'Status': 'Inactive',
    });
    
    if (!record) {
      throw new Error('Ad product not found or delete failed');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting ad product:', error);
    throw error;
  }
}
