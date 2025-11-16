import { base, TABLES } from '../client';
import type { CampaignFields, AirtableRecordType, PipelineStatus } from '../types';

export type CampaignRecord = AirtableRecordType<CampaignFields>;

// Get all campaigns
export async function getAllCampaigns(): Promise<CampaignRecord[]> {
  if (!base) {
    console.warn('[Airtable] getAllCampaigns called but Airtable not configured');
    return [];
  }

  try {
    const records = await base(TABLES.CAMPAIGNS)
      .select({
        sort: [{ field: 'Start Date', direction: 'desc' }],
      })
      .all();

    return records as unknown as CampaignRecord[];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

// Get campaign by ID
export async function getCampaignById(recordId: string): Promise<CampaignRecord | null> {
  if (!base) {
    console.warn('[Airtable] getCampaignById called but Airtable not configured');
    return null;
  }

  try {
    const record = await base(TABLES.CAMPAIGNS).find(recordId);
    return record as unknown as CampaignRecord;
  } catch (error) {
    console.error('Error fetching campaign by ID:', error);
    return null;
  }
}

// Get campaigns by advertiser ID
export async function getCampaignsByAdvertiser(advertiserId: string): Promise<CampaignRecord[]> {
  if (!base) {
    console.warn('[Airtable] getCampaignsByAdvertiser called but Airtable not configured');
    return [];
  }

  try {
    const formula = `FIND('${advertiserId}', ARRAYJOIN({Advertiser}))`;

    const records = await base(TABLES.CAMPAIGNS)
      .select({
        filterByFormula: formula,
        sort: [{ field: 'Start Date', direction: 'desc' }],
      })
      .all();

    return records as unknown as CampaignRecord[];
  } catch (error) {
    console.error('Error fetching campaigns by advertiser:', error);
    throw error;
  }
}

// Get campaigns by status
export async function getCampaignsByStatus(status: 'Planning' | 'Active' | 'Completed' | 'Cancelled'): Promise<CampaignRecord[]> {
  if (!base) {
    console.warn('[Airtable] getCampaignsByStatus called but Airtable not configured');
    return [];
  }

  try {
    const formula = `{Status} = '${status}'`;

    const records = await base(TABLES.CAMPAIGNS)
      .select({
        filterByFormula: formula,
        sort: [{ field: 'Start Date', direction: 'desc' }],
      })
      .all();

    return records as unknown as CampaignRecord[];
  } catch (error) {
    console.error('Error fetching campaigns by status:', error);
    throw error;
  }
}

// Get campaigns by pipeline status
export async function getCampaignsByPipelineStatus(pipelineStatus: PipelineStatus): Promise<CampaignRecord[]> {
  if (!base) {
    console.warn('[Airtable] getCampaignsByPipelineStatus called but Airtable not configured');
    return [];
  }

  try {
    const formula = `{Pipeline Status} = '${pipelineStatus}'`;

    const records = await base(TABLES.CAMPAIGNS)
      .select({
        filterByFormula: formula,
        sort: [{ field: 'Start Date', direction: 'desc' }],
      })
      .all();

    return records as unknown as CampaignRecord[];
  } catch (error) {
    console.error('Error fetching campaigns by pipeline status:', error);
    throw error;
  }
}

// Get pipeline status counts for dashboard
export async function getPipelineStatusCounts(): Promise<Record<PipelineStatus, number>> {
  if (!base) {
    console.warn('[Airtable] getPipelineStatusCounts called but Airtable not configured');
    return {
      '문의중': 0,
      '견적제시': 0,
      '일정조율중': 0,
      '부킹확정': 0,
      '집행중': 0,
      '결과보고': 0,
      '세금계산서 발행 및 대금 청구': 0,
      '매출 입금': 0,
    };
  }

  try {
    const records = await base(TABLES.CAMPAIGNS).select().all();
    
    const counts: Record<PipelineStatus, number> = {
      '문의중': 0,
      '견적제시': 0,
      '일정조율중': 0,
      '부킹확정': 0,
      '집행중': 0,
      '결과보고': 0,
      '세금계산서 발행 및 대금 청구': 0,
      '매출 입금': 0,
    };

    for (const record of records) {
      const campaignRecord = record as unknown as CampaignRecord;
      const pipelineStatus = campaignRecord.fields['Pipeline Status'];
      if (pipelineStatus && pipelineStatus in counts) {
        counts[pipelineStatus]++;
      }
    }

    return counts;
  } catch (error) {
    console.error('Error getting pipeline status counts:', error);
    throw error;
  }
}

// Create campaign
export async function createCampaign(data: {
  campaignName: string;
  advertiserId: string;
  startDate: string;
  endDate: string;
  status?: 'Planning' | 'Active' | 'Completed' | 'Cancelled';
  pipelineStatus?: PipelineStatus;
  adProductIds?: string[];
  utmCampaign?: string;
  googleCalendarId?: string;
}): Promise<CampaignRecord> {
  if (!base) {
    throw new Error('Cannot create campaign: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  try {
    const fields: Partial<CampaignFields> = {
      'Campaign Name': data.campaignName,
      'Advertiser': [data.advertiserId],
      'Start Date': data.startDate,
      'End Date': data.endDate,
      'Status': data.status || 'Planning',
      'Pipeline Status': data.pipelineStatus || '문의중',
    };

    if (data.adProductIds && data.adProductIds.length > 0) {
      fields['Ad Products'] = data.adProductIds;
    }
    if (data.utmCampaign) fields['UTM Campaign'] = data.utmCampaign;
    if (data.googleCalendarId) fields['Google Calendar ID'] = data.googleCalendarId;

    const record = await base(TABLES.CAMPAIGNS).create(fields);
    return record as unknown as CampaignRecord;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

// Update campaign
export async function updateCampaign(
  recordId: string,
  data: Partial<{
    campaignName: string;
    advertiserId: string;
    startDate: string;
    endDate: string;
    status: 'Planning' | 'Active' | 'Completed' | 'Cancelled';
    pipelineStatus: PipelineStatus;
    adProductIds: string[];
    utmCampaign: string;
    googleCalendarId: string;
  }>
): Promise<CampaignRecord> {
  if (!base) {
    throw new Error('Cannot update campaign: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Campaign ID is required');
  }

  try {
    const fields: Partial<CampaignFields> = {};

    if (data.campaignName !== undefined) fields['Campaign Name'] = data.campaignName;
    if (data.advertiserId !== undefined) fields['Advertiser'] = [data.advertiserId];
    if (data.startDate !== undefined) fields['Start Date'] = data.startDate;
    if (data.endDate !== undefined) fields['End Date'] = data.endDate;
    if (data.status !== undefined) fields['Status'] = data.status;
    if (data.pipelineStatus !== undefined) fields['Pipeline Status'] = data.pipelineStatus;
    if (data.adProductIds !== undefined) fields['Ad Products'] = data.adProductIds;
    if (data.utmCampaign !== undefined) fields['UTM Campaign'] = data.utmCampaign;
    if (data.googleCalendarId !== undefined) fields['Google Calendar ID'] = data.googleCalendarId;

    const record = await base(TABLES.CAMPAIGNS).update(recordId, fields);
    return record as unknown as CampaignRecord;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

// Delete campaign
export async function deleteCampaign(recordId: string): Promise<boolean> {
  if (!base) {
    throw new Error('Cannot delete campaign: Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  if (!recordId) {
    throw new Error('Campaign ID is required');
  }

  try {
    await base(TABLES.CAMPAIGNS).destroy(recordId);
    return true;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
}
