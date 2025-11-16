/**
 * In-memory user store for development when Airtable is not configured
 */

import type { UserRecord } from './tables/users';

// In-memory user store
const memoryUsers = new Map<string, UserRecord>();

// Create a mock UserRecord
function createMockUserRecord(data: {
  googleUid: string;
  email: string;
  name: string;
  role?: 'Admin' | 'User' | 'ReadOnly';
}): UserRecord {
  const id = `mem_${data.googleUid}`;
  
  return {
    id,
    fields: {
      'Name': data.name,
      'Email': data.email,
      'Google UID': data.googleUid,
      'Role': data.role || (
        ['mse@venturesquare.net', 'rosie@venturesquare.net'].includes(data.email.toLowerCase())
          ? 'Admin'
          : 'User'
      ),
      'Status': 'Active' as const,
    },
    _rawJson: {},
  } as any as UserRecord;
}

export const memoryUserStore = {
  getUserByGoogleId: (googleUid: string): UserRecord | null => {
    for (const user of memoryUsers.values()) {
      if (user.fields['Google UID'] === googleUid) {
        return user;
      }
    }
    return null;
  },

  getUserByEmail: (email: string): UserRecord | null => {
    for (const user of memoryUsers.values()) {
      if (user.fields['Email'].toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  },

  getUserById: (id: string): UserRecord | null => {
    return memoryUsers.get(id) || null;
  },

  createUser: (data: {
    googleUid: string;
    email: string;
    name: string;
    role?: 'Admin' | 'User' | 'ReadOnly';
  }): UserRecord => {
    const user = createMockUserRecord(data);
    memoryUsers.set(user.id, user);
    console.log(`[MemoryStore] Created user: ${user.fields['Email']} (${user.id})`);
    return user;
  },

  getAllActiveUsers: (): UserRecord[] => {
    return Array.from(memoryUsers.values()).filter(
      u => u.fields['Status'] === 'Active'
    );
  },

  clear: () => {
    memoryUsers.clear();
  },
};
