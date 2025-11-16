import { base, TABLES } from '../client';
import type { AgencyFields, AirtableRecordType } from '../types';

export type AgencyRecord = AirtableRecordType<AgencyFields>;

// Get all agencies
export async function getAllAgencies(): Promise<AgencyRecord[]> {
  if (!base) {
    console.warn('[Airtable] getAllAgencies called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.AGENCIES)
      .select({
        sort: [{ field: 'Name', direction: 'asc' }],
      })
      .all();

    return records as unknown as AgencyRecord[];
  } catch (error) {
    console.error('Error fetching agencies:', error);
    throw error;
  }
}

// Get agency by ID
export async function getAgencyById(recordId: string): Promise<AgencyRecord | null> {
  if (!base) {
    console.warn('[Airtable] getAgencyById called but Airtable not configured');
    return null;
  }

  try {
    const record = await base(TABLES.AGENCIES).find(recordId);
    return record as unknown as AgencyRecord;
  } catch (error) {
    console.error('Error fetching agency by ID:', error);
    return null;
  }
}

// Create agency
export async function createAgency(data: {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessRegistrationNumber?: string;
  notes?: string;
  status?: 'Active' | 'Inactive';
}): Promise<AgencyRecord> {
  if (!base) {
    throw new Error('Cannot create agency: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  try {
    const fields: Partial<AgencyFields> = {
      'Name': data.name,
      'Contact Person': data.contactPerson,
      'Email': data.email,
      'Phone': data.phone,
      'Status': data.status || 'Active',
    };

    if (data.businessRegistrationNumber) fields['Business Registration Number'] = data.businessRegistrationNumber;
    if (data.notes) fields['Notes'] = data.notes;

    const record = await base(TABLES.AGENCIES).create(fields);
    return record as unknown as AgencyRecord;
  } catch (error) {
    console.error('Error creating agency:', error);
    throw error;
  }
}

// Update agency
export async function updateAgency(
  recordId: string,
  data: Partial<{
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    businessRegistrationNumber: string;
    notes: string;
    status: 'Active' | 'Inactive';
  }>
): Promise<AgencyRecord> {
  if (!base) {
    throw new Error('Cannot update agency: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Agency ID is required');
  }

  try {
    const fields: Partial<AgencyFields> = {};

    if (data.name) fields['Name'] = data.name;
    if (data.contactPerson) fields['Contact Person'] = data.contactPerson;
    if (data.email) fields['Email'] = data.email;
    if (data.phone) fields['Phone'] = data.phone;
    if (data.businessRegistrationNumber) fields['Business Registration Number'] = data.businessRegistrationNumber;
    if (data.notes !== undefined) fields['Notes'] = data.notes;
    if (data.status) fields['Status'] = data.status;

    if (Object.keys(fields).length === 0) {
      throw new Error('No fields to update');
    }

    const record = await base(TABLES.AGENCIES).update(recordId, fields);
    
    if (!record) {
      throw new Error('Agency not found or update failed');
    }
    
    return record as unknown as AgencyRecord;
  } catch (error) {
    console.error('Error updating agency:', error);
    throw error;
  }
}

// Delete agency (soft delete by setting status to Inactive)
export async function deleteAgency(recordId: string): Promise<boolean> {
  if (!base) {
    throw new Error('Cannot delete agency: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Agency ID is required');
  }

  try {
    const record = await base(TABLES.AGENCIES).update(recordId, {
      'Status': 'Inactive',
    });
    
    if (!record) {
      throw new Error('Agency not found or delete failed');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting agency:', error);
    throw error;
  }
}

// Get agencies by status
export async function getAgenciesByStatus(
  status: 'Active' | 'Inactive'
): Promise<AgencyRecord[]> {
  if (!base) {
    console.warn('[Airtable] getAgenciesByStatus called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.AGENCIES)
      .select({
        filterByFormula: `{Status} = '${status}'`,
        sort: [{ field: 'Name', direction: 'asc' }],
      })
      .all();

    return records as unknown as AgencyRecord[];
  } catch (error) {
    console.error('Error fetching agencies by status:', error);
    throw error;
  }
}
