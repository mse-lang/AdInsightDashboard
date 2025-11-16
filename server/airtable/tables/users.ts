import { base, TABLES, AIRTABLE_ENABLED } from '../client';
import type { UserFields, AirtableRecordType } from '../types';
import { memoryUserStore } from '../memory-store';

export type UserRecord = AirtableRecordType<UserFields>;

// Get user by Google UID
export async function getUserByGoogleId(googleUid: string): Promise<UserRecord | null> {
  if (!AIRTABLE_ENABLED) {
    return memoryUserStore.getUserByGoogleId(googleUid);
  }
  if (!base) {
    return null;
  }

  try {
    const records = await base(TABLES.USERS)
      .select({
        filterByFormula: `{Google UID} = '${googleUid}'`,
        maxRecords: 1,
      })
      .firstPage();

    return (records[0] as unknown as UserRecord) || null;
  } catch (error) {
    console.error('Error fetching user by Google UID:', error);
    throw error;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  if (!AIRTABLE_ENABLED) {
    return memoryUserStore.getUserByEmail(email);
  }
  if (!base) {
    return null;
  }

  try {
    const records = await base(TABLES.USERS)
      .select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1,
      })
      .firstPage();

    return (records[0] as unknown as UserRecord) || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

// Get user by record ID
export async function getUserById(recordId: string): Promise<UserRecord | null> {
  if (!AIRTABLE_ENABLED) {
    return memoryUserStore.getUserById(recordId);
  }
  if (!base) {
    return null;
  }

  try {
    const record = await base(TABLES.USERS).find(recordId);
    return record as unknown as UserRecord;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

// Create new user
export async function createUser(data: {
  name: string;
  email: string;
  googleUid: string;
  role?: 'Admin' | 'User' | 'ReadOnly';
}): Promise<UserRecord> {
  if (!AIRTABLE_ENABLED) {
    return memoryUserStore.createUser(data);
  }
  if (!base) {
    throw new Error('Cannot create user: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  // Determine role based on email
  const adminEmails = ['mse@venturesquare.net', 'rosie@venturesquare.net'];
  const defaultRole = adminEmails.includes(data.email.toLowerCase()) ? 'Admin' : 'User';

  try {
    const record = await base(TABLES.USERS).create({
      'Name': data.name,
      'Email': data.email,
      'Google UID': data.googleUid,
      'Role': data.role || defaultRole,
      'Status': 'Active',
    });

    return record as unknown as UserRecord;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Update user
export async function updateUser(
  recordId: string,
  data: Partial<UserFields>
): Promise<UserRecord> {
  if (!base) {
    throw new Error('Cannot update user: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  try {
    const record = await base(TABLES.USERS).update(recordId, data);
    return record as unknown as UserRecord;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Get all active users
export async function getAllActiveUsers(): Promise<UserRecord[]> {
  if (!AIRTABLE_ENABLED) {
    return memoryUserStore.getAllActiveUsers();
  }
  if (!base) {
    return [];
  }

  try {
    const records = await base(TABLES.USERS)
      .select({
        filterByFormula: `{Status} = 'Active'`,
      })
      .all();

    return records as unknown as UserRecord[];
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
}

// Check if user is admin
export function isAdmin(user: UserRecord): boolean {
  return user.fields['Role'] === 'Admin';
}

// Check if user can edit (Admin or User role)
export function canEdit(user: UserRecord): boolean {
  return user.fields['Role'] === 'Admin' || user.fields['Role'] === 'User';
}
