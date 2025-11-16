import { base, TABLES } from '../client';
import type { AdvertiserFields, AirtableRecordType } from '../types';

export type AdvertiserRecord = AirtableRecordType<AdvertiserFields>;

// Get all advertisers
export async function getAllAdvertisers(): Promise<AdvertiserRecord[]> {
  if (!base) {
    console.warn('[Airtable] getAllAdvertisers called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.ADVERTISERS)
      .select({
        sort: [{ field: 'Company Name', direction: 'asc' }],
      })
      .all();

    return records as unknown as AdvertiserRecord[];
  } catch (error) {
    console.error('Error fetching advertisers:', error);
    throw error;
  }
}

// Get advertiser by ID
export async function getAdvertiserById(recordId: string): Promise<AdvertiserRecord | null> {
  if (!base) {
    console.warn('[Airtable] getAdvertiserById called but Airtable not configured');
    return null;
  }

  try {
    const record = await base(TABLES.ADVERTISERS).find(recordId);
    return record as unknown as AdvertiserRecord;
  } catch (error) {
    console.error('Error fetching advertiser by ID:', error);
    return null;
  }
}

// Search advertisers by query
export async function searchAdvertisers(query: string): Promise<AdvertiserRecord[]> {
  if (!base) {
    console.warn('[Airtable] searchAdvertisers called but Airtable not configured');
    return [];
  }

  try {
    const formula = `OR(
      SEARCH(LOWER('${query}'), LOWER({Company Name})),
      SEARCH(LOWER('${query}'), LOWER({Contact Person})),
      SEARCH(LOWER('${query}'), LOWER({Email}))
    )`;

    const records = await base(TABLES.ADVERTISERS)
      .select({
        filterByFormula: formula,
      })
      .all();

    return records as unknown as AdvertiserRecord[];
  } catch (error) {
    console.error('Error searching advertisers:', error);
    throw error;
  }
}

// Create advertiser
export async function createAdvertiser(data: {
  companyName: string;
  contactPerson: string;
  contactPersonType: 'Advertiser' | 'Agency';
  email: string;
  phone: string;
  businessNumber?: string;
  businessRegistrationNumber?: string;
  bankAccountNumber?: string;
  adMaterials?: string;
  agencyId?: string;
  industry?: string;
  accountManagerId?: string;
  status?: 'Lead' | 'Active' | 'Inactive';
}): Promise<AdvertiserRecord> {
  if (!base) {
    throw new Error('Cannot create advertiser: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  try {
    const fields: Partial<AdvertiserFields> = {
      'Company Name': data.companyName,
      'Contact Person': data.contactPerson,
      'Contact Person Type': data.contactPersonType,
      'Email': data.email,
      'Phone': data.phone,
      'Status': data.status || 'Lead',
    };

    if (data.businessNumber) fields['Business Number'] = data.businessNumber;
    if (data.businessRegistrationNumber) fields['Business Registration Number'] = data.businessRegistrationNumber;
    if (data.bankAccountNumber) fields['Bank Account Number'] = data.bankAccountNumber;
    if (data.adMaterials) fields['Ad Materials'] = data.adMaterials;
    if (data.agencyId) fields['Agency'] = [data.agencyId];
    if (data.industry) fields['Industry'] = data.industry;
    if (data.accountManagerId) fields['Account Manager'] = [data.accountManagerId];

    const record = await base(TABLES.ADVERTISERS).create(fields);
    return record as unknown as AdvertiserRecord;
  } catch (error) {
    console.error('Error creating advertiser:', error);
    throw error;
  }
}

// Update advertiser
export async function updateAdvertiser(
  recordId: string,
  data: Partial<{
    companyName: string;
    contactPerson: string;
    contactPersonType: 'Advertiser' | 'Agency';
    email: string;
    phone: string;
    businessNumber: string;
    businessRegistrationNumber: string;
    bankAccountNumber: string;
    adMaterials: string;
    agencyId: string;
    industry: string;
    accountManagerId: string;
    status: 'Lead' | 'Active' | 'Inactive';
  }>
): Promise<AdvertiserRecord> {
  if (!base) {
    throw new Error('Cannot update advertiser: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Advertiser ID is required');
  }

  try {
    const fields: Partial<AdvertiserFields> = {};

    if (data.companyName) fields['Company Name'] = data.companyName;
    if (data.contactPerson) fields['Contact Person'] = data.contactPerson;
    if (data.contactPersonType) fields['Contact Person Type'] = data.contactPersonType;
    if (data.email) fields['Email'] = data.email;
    if (data.phone) fields['Phone'] = data.phone;
    if (data.businessNumber) fields['Business Number'] = data.businessNumber;
    if (data.businessRegistrationNumber) fields['Business Registration Number'] = data.businessRegistrationNumber;
    if (data.bankAccountNumber) fields['Bank Account Number'] = data.bankAccountNumber;
    if (data.adMaterials !== undefined) fields['Ad Materials'] = data.adMaterials;
    if (data.agencyId) fields['Agency'] = [data.agencyId];
    if (data.industry) fields['Industry'] = data.industry;
    if (data.accountManagerId) fields['Account Manager'] = [data.accountManagerId];
    if (data.status) fields['Status'] = data.status;

    if (Object.keys(fields).length === 0) {
      throw new Error('No fields to update');
    }

    const record = await base(TABLES.ADVERTISERS).update(recordId, fields);
    
    if (!record) {
      throw new Error('Advertiser not found or update failed');
    }
    
    return record as unknown as AdvertiserRecord;
  } catch (error) {
    console.error('Error updating advertiser:', error);
    throw error;
  }
}

// Delete advertiser (soft delete by setting status to Inactive)
export async function deleteAdvertiser(recordId: string): Promise<boolean> {
  if (!base) {
    throw new Error('Cannot delete advertiser: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Advertiser ID is required');
  }

  try {
    const record = await base(TABLES.ADVERTISERS).update(recordId, {
      'Status': 'Inactive',
    });
    
    if (!record) {
      throw new Error('Advertiser not found or delete failed');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting advertiser:', error);
    throw error;
  }
}

// Get advertisers by status
export async function getAdvertisersByStatus(
  status: 'Lead' | 'Active' | 'Inactive'
): Promise<AdvertiserRecord[]> {
  if (!base) {
    console.warn('[Airtable] getAdvertisersByStatus called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.ADVERTISERS)
      .select({
        filterByFormula: `{Status} = '${status}'`,
        sort: [{ field: 'Company Name', direction: 'asc' }],
      })
      .all();

    return records as unknown as AdvertiserRecord[];
  } catch (error) {
    console.error('Error fetching advertisers by status:', error);
    throw error;
  }
}
