import { base, TABLES } from '../client';
import type { CommunicationLogFields, AirtableRecordType } from '../types';

export type CommunicationLogRecord = AirtableRecordType<CommunicationLogFields>;

export async function getAllCommunicationLogs(): Promise<CommunicationLogRecord[]> {
  if (!base) {
    console.warn('[Airtable] getAllCommunicationLogs called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.COMMUNICATION_LOGS)
      .select({
        sort: [{ field: 'Sent At', direction: 'desc' }],
      })
      .all();

    return records as unknown as CommunicationLogRecord[];
  } catch (error) {
    console.error('Error fetching communication logs:', error);
    throw error;
  }
}

export async function getCommunicationLogsByAdvertiser(
  advertiserId: string
): Promise<CommunicationLogRecord[]> {
  if (!base) {
    console.warn('[Airtable] getCommunicationLogsByAdvertiser called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.COMMUNICATION_LOGS)
      .select({
        filterByFormula: `FIND("${advertiserId}", ARRAYJOIN({Advertiser}))`,
        sort: [{ field: 'Sent At', direction: 'desc' }],
      })
      .all();

    return records as unknown as CommunicationLogRecord[];
  } catch (error) {
    console.error('Error fetching communication logs by advertiser:', error);
    throw error;
  }
}

export async function createCommunicationLog(data: {
  advertiserId: string;
  type: 'Email' | 'SMS' | 'KakaoTalk' | 'Inbound Email';
  subject?: string;
  content: string;
  senderId?: string;
  status?: 'Sent' | 'Failed' | 'Delivered' | 'Read';
  externalId?: string;
}): Promise<CommunicationLogRecord> {
  if (!base) {
    throw new Error('Cannot create communication log: Airtable not configured');
  }

  try {
    const fields: Partial<CommunicationLogFields> = {
      'Advertiser': [data.advertiserId],
      'Type': data.type,
      'Content': data.content,
      'Status': data.status || 'Sent',
      'Sent At': new Date().toISOString(),
    };

    if (data.subject) fields['Subject'] = data.subject;
    if (data.senderId) fields['Sender'] = [data.senderId];
    if (data.externalId) fields['External ID'] = data.externalId;

    const record = await base(TABLES.COMMUNICATION_LOGS).create(fields);
    return record as unknown as CommunicationLogRecord;
  } catch (error) {
    console.error('Error creating communication log:', error);
    throw error;
  }
}
