import { base, TABLES, AIRTABLE_ENABLED } from '../client';
import type { AdProductFields } from '../types';
import type { FieldSet } from 'airtable';

// Airtable Pricing type with string ID (Airtable record IDs are alphanumeric)
export interface AirtablePricing {
  id: string; // Airtable record ID (e.g., "recABC123")
  productName: string;
  productKey: string;
  price: string;
  specs: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdProductRecord {
  id: string;
  fields: AdProductFields;
  createdTime: string;
}

// Convert Airtable record to AirtablePricing format
function toAirtablePricing(record: AdProductRecord): AirtablePricing {
  // Generate productKey from Product Name (lowercase, replace spaces with underscores)
  const productKey = record.fields['Product Name']
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return {
    id: record.id, // Use Airtable record ID directly
    productName: record.fields['Product Name'],
    productKey: productKey,
    price: record.fields['Unit Price']?.toString() || '0',
    specs: record.fields['Dimensions'] || record.fields['Position'] || '',
    description: record.fields['Description'] || '',
    createdAt: new Date(record.createdTime),
    updatedAt: new Date(record.createdTime),
  };
}

// Get all ad products
export async function getAllAdProducts(): Promise<AdProductRecord[]> {
  if (!AIRTABLE_ENABLED || !base) {
    return [];
  }

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

// Get all ad products as Pricing format
export async function getAllPricings(): Promise<AirtablePricing[]> {
  if (!AIRTABLE_ENABLED || !base) {
    return [];
  }

  try {
    const records = await getAllAdProducts();
    return records.map(toAirtablePricing);
  } catch (error) {
    console.error('Error fetching pricings:', error);
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
  if (!AIRTABLE_ENABLED || !base) {
    return null;
  }

  try {
    const record = await base(TABLES.AD_PRODUCTS).find(recordId);
    if (!record) return null;
    return record as unknown as AdProductRecord;
  } catch (error) {
    console.error('Error fetching ad product:', error);
    throw error;
  }
}

// Get pricing by product key
export async function getPricingByKey(productKey: string): Promise<AirtablePricing | null> {
  if (!AIRTABLE_ENABLED || !base) {
    return null;
  }

  try {
    const records = await getAllPricings();
    return records.find(p => p.productKey === productKey) || null;
  } catch (error) {
    console.error('Error fetching pricing by key:', error);
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
  if (!AIRTABLE_ENABLED || !base) {
    throw new Error('Airtable not configured');
  }

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

// Create pricing (converts from Pricing format)
export async function createPricing(data: {
  productName: string;
  productKey: string;
  price: string;
  specs?: string;
  description?: string;
}): Promise<AirtablePricing> {
  if (!AIRTABLE_ENABLED || !base) {
    throw new Error('Airtable not configured');
  }

  try {
    const unitPrice = parseInt(data.price) || 0;
    
    const record = await createAdProduct({
      productName: data.productName,
      description: data.description,
      format: 'Banner', // Default format
      dimensions: data.specs,
      unitPrice: unitPrice,
      status: 'Active',
    });

    return toAirtablePricing(record);
  } catch (error) {
    console.error('Error creating pricing:', error);
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
  if (!AIRTABLE_ENABLED || !base) {
    throw new Error('Airtable not configured');
  }

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

// Update pricing by Airtable record ID
export async function updatePricing(
  id: string, // Airtable record ID
  data: {
    productName?: string;
    price?: string;
    specs?: string;
    description?: string;
  }
): Promise<AirtablePricing | null> {
  if (!AIRTABLE_ENABLED || !base) {
    throw new Error('Airtable not configured');
  }

  try {
    const updateData: {
      productName?: string;
      description?: string;
      dimensions?: string;
      unitPrice?: number;
    } = {};

    if (data.productName) updateData.productName = data.productName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.specs !== undefined) updateData.dimensions = data.specs;
    if (data.price) updateData.unitPrice = parseInt(data.price) || 0;

    const updated = await updateAdProduct(id, updateData);
    if (!updated) return null;

    return toAirtablePricing(updated);
  } catch (error) {
    console.error('Error updating pricing:', error);
    throw error;
  }
}

// Delete ad product (soft delete by setting status to Inactive)
export async function deleteAdProduct(recordId: string): Promise<boolean> {
  if (!AIRTABLE_ENABLED || !base) {
    throw new Error('Airtable not configured');
  }

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

// Delete pricing by Airtable record ID
export async function deletePricing(id: string): Promise<boolean> {
  if (!AIRTABLE_ENABLED || !base) {
    throw new Error('Airtable not configured');
  }

  try {
    return await deleteAdProduct(id);
  } catch (error) {
    console.error('Error deleting pricing:', error);
    throw error;
  }
}
