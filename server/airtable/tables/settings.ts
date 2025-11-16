import { base } from '../client';
import type { SystemSettingsFields } from '../types';
import type { Records } from 'airtable';

const TABLE_NAME = 'System Settings';

export interface GeneralSettings {
  companyName: string;
  ceoName: string;
  companyEmail: string;
  companyPhone: string;
  businessNumber: string;
  companyAddress: string;
  businessType: string;
  businessClass: string;
  bankName: string;
  bankAccountNumber: string;
}

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  companyName: '벤처스퀘어',
  ceoName: '',
  companyEmail: 'ad@venturesquare.net',
  companyPhone: '02-1234-5678',
  businessNumber: '123-45-67890',
  companyAddress: '',
  businessType: '',
  businessClass: '',
  bankName: '',
  bankAccountNumber: '',
};

const GENERAL_SETTINGS_KEYS = {
  companyName: 'CompanyName',
  ceoName: 'CEOName',
  companyEmail: 'CompanyEmail',
  companyPhone: 'CompanyPhone',
  businessNumber: 'BusinessNumber',
  companyAddress: 'CompanyAddress',
  businessType: 'BusinessType',
  businessClass: 'BusinessClass',
  bankName: 'BankName',
  bankAccountNumber: 'BankAccountNumber',
};

export async function getGeneralSettings(): Promise<GeneralSettings> {
  try {
    const records = await base<SystemSettingsFields>(TABLE_NAME)
      .select({
        filterByFormula: "{Category} = 'General'",
      })
      .all();

    const settings: Partial<GeneralSettings> = {};

    for (const record of records) {
      const key = record.fields['Key'];
      const value = record.fields['Value'];

      const settingKey = Object.entries(GENERAL_SETTINGS_KEYS).find(
        ([_, airtableKey]) => airtableKey === key
      )?.[0] as keyof GeneralSettings | undefined;

      if (settingKey) {
        settings[settingKey] = value;
      }
    }

    return { ...DEFAULT_GENERAL_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error fetching general settings:', error);
    return DEFAULT_GENERAL_SETTINGS;
  }
}

export async function updateGeneralSettings(
  settings: Partial<GeneralSettings>
): Promise<GeneralSettings> {
  try {
    const existingRecords = await base<SystemSettingsFields>(TABLE_NAME)
      .select({
        filterByFormula: "{Category} = 'General'",
      })
      .all();

    const recordMap = new Map<string, string>();
    for (const record of existingRecords) {
      recordMap.set(record.fields['Key'], record.id);
    }

    const updatePromises = Object.entries(settings).map(
      async ([settingKey, value]) => {
        const airtableKey = GENERAL_SETTINGS_KEYS[settingKey as keyof GeneralSettings];
        if (!airtableKey || value === undefined) return null;

        const recordId = recordMap.get(airtableKey);

        if (recordId) {
          return base<SystemSettingsFields>(TABLE_NAME).update(recordId, {
            Value: value,
          });
        } else {
          return base<SystemSettingsFields>(TABLE_NAME).create({
            Category: 'General',
            Key: airtableKey,
            Value: value,
          });
        }
      }
    );

    await Promise.all(updatePromises.filter((p) => p !== null));

    return getGeneralSettings();
  } catch (error) {
    console.error('Error updating general settings:', error);
    throw error;
  }
}

// Notification settings
export interface NotificationSettings {
  inquiryNotification: boolean;
  quoteNotification: boolean;
  campaignNotification: boolean;
  paymentNotification: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  inquiryNotification: true,
  quoteNotification: true,
  campaignNotification: true,
  paymentNotification: true,
};

const NOTIFICATION_SETTINGS_KEYS = {
  inquiryNotification: 'InquiryNotification',
  quoteNotification: 'QuoteNotification',
  campaignNotification: 'CampaignNotification',
  paymentNotification: 'PaymentNotification',
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const records = await base<SystemSettingsFields>(TABLE_NAME)
      .select({
        filterByFormula: "{Category} = 'Notifications'",
      })
      .all();

    const settings: Partial<NotificationSettings> = {};

    for (const record of records) {
      const key = record.fields['Key'];
      const value = record.fields['Value'] === 'true';

      const settingKey = Object.entries(NOTIFICATION_SETTINGS_KEYS).find(
        ([_, airtableKey]) => airtableKey === key
      )?.[0] as keyof NotificationSettings | undefined;

      if (settingKey) {
        settings[settingKey] = value;
      }
    }

    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  try {
    const existingRecords = await base<SystemSettingsFields>(TABLE_NAME)
      .select({
        filterByFormula: "{Category} = 'Notifications'",
      })
      .all();

    const recordMap = new Map<string, string>();
    for (const record of existingRecords) {
      recordMap.set(record.fields['Key'], record.id);
    }

    const updatePromises = Object.entries(settings).map(
      async ([settingKey, value]) => {
        const airtableKey = NOTIFICATION_SETTINGS_KEYS[settingKey as keyof NotificationSettings];
        if (!airtableKey || value === undefined) return null;

        const recordId = recordMap.get(airtableKey);
        // Explicitly convert boolean to string
        const stringValue = value === true ? 'true' : 'false';

        if (recordId) {
          return base<SystemSettingsFields>(TABLE_NAME).update(recordId, {
            'Value': stringValue,
          } as SystemSettingsFields);
        } else {
          return base<SystemSettingsFields>(TABLE_NAME).create({
            'Category': 'Notifications',
            'Key': airtableKey,
            'Value': stringValue,
          } as SystemSettingsFields);
        }
      }
    );

    await Promise.all(updatePromises.filter((p) => p !== null));

    return getNotificationSettings();
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
}
