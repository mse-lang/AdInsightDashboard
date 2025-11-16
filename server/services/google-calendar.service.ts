import { google } from 'googleapis';
import type { CampaignRecord } from '../airtable/tables/campaigns';
import type { AdvertiserRecord } from '../airtable/tables/advertisers';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getUncachableCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Format campaign comprehensive information for calendar event description
 */
export function formatCampaignDescription(
  campaign: CampaignRecord,
  advertiser: AdvertiserRecord | null,
  adProducts?: any[]
): string {
  const lines: string[] = [];
  
  lines.push('=== 캠페인 종합 정보 ===\n');
  
  // Basic Campaign Info
  lines.push(`📋 캠페인명: ${campaign.fields['Campaign Name']}`);
  lines.push(`📅 기간: ${campaign.fields['Start Date']} ~ ${campaign.fields['End Date']}`);
  lines.push(`📊 상태: ${campaign.fields['Status']}`);
  lines.push(`🔄 파이프라인 단계: ${campaign.fields['Pipeline Status']}`);
  
  if (campaign.fields['UTM Campaign']) {
    lines.push(`🔗 UTM 캠페인: ${campaign.fields['UTM Campaign']}`);
  }
  
  lines.push('');
  
  // Advertiser Info
  if (advertiser) {
    lines.push('👤 광고주 정보:');
    lines.push(`  - 회사명: ${advertiser.fields['Company Name']}`);
    if (advertiser.fields['Contact Name']) {
      lines.push(`  - 담당자: ${advertiser.fields['Contact Name']}`);
    }
    if (advertiser.fields['Email']) {
      lines.push(`  - 이메일: ${advertiser.fields['Email']}`);
    }
    if (advertiser.fields['Phone']) {
      lines.push(`  - 전화: ${advertiser.fields['Phone']}`);
    }
    lines.push('');
  }
  
  // Ad Products
  if (adProducts && adProducts.length > 0) {
    lines.push('📦 광고 상품:');
    adProducts.forEach((product, index) => {
      lines.push(`  ${index + 1}. ${product.fields?.['Product Name'] || '상품 정보 없음'}`);
    });
    lines.push('');
  }
  
  // Creatives count
  const creativesCount = campaign.fields['Creatives']?.length || 0;
  if (creativesCount > 0) {
    lines.push(`🎨 크리에이티브: ${creativesCount}개`);
  }
  
  // Reports count
  const reportsCount = campaign.fields['Reports']?.length || 0;
  if (reportsCount > 0) {
    lines.push(`📈 리포트: ${reportsCount}개`);
  }
  
  lines.push('');
  lines.push('---');
  lines.push(`Venture Square 광고 관리 시스템에서 생성됨`);
  lines.push(`캠페인 ID: ${campaign.id}`);
  
  return lines.join('\n');
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  htmlLink: string;
}

/**
 * Create a calendar event from campaign data
 */
export async function createCampaignEvent(
  campaign: CampaignRecord,
  advertiser: AdvertiserRecord | null,
  adProducts?: any[],
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  try {
    const calendar = await getUncachableCalendarClient();
    
    const description = formatCampaignDescription(campaign, advertiser, adProducts);
    
    const event = {
      summary: `[광고] ${campaign.fields['Campaign Name']}`,
      description: description,
      start: {
        date: campaign.fields['Start Date'],
        timeZone: 'Asia/Seoul',
      },
      end: {
        date: campaign.fields['End Date'],
        timeZone: 'Asia/Seoul',
      },
      colorId: '11', // Red color for advertising campaigns
    };
    
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });
    
    return response.data as CalendarEvent;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCampaignEvent(
  eventId: string,
  campaign: CampaignRecord,
  advertiser: AdvertiserRecord | null,
  adProducts?: any[],
  calendarId: string = 'primary'
): Promise<CalendarEvent> {
  try {
    const calendar = await getUncachableCalendarClient();
    
    const description = formatCampaignDescription(campaign, advertiser, adProducts);
    
    const event = {
      summary: `[광고] ${campaign.fields['Campaign Name']}`,
      description: description,
      start: {
        date: campaign.fields['Start Date'],
        timeZone: 'Asia/Seoul',
      },
      end: {
        date: campaign.fields['End Date'],
        timeZone: 'Asia/Seoul',
      },
      colorId: '11',
    };
    
    const response = await calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: event,
    });
    
    return response.data as CalendarEvent;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCampaignEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  try {
    const calendar = await getUncachableCalendarClient();
    
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

/**
 * Get calendar event by ID
 */
export async function getCalendarEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent | null> {
  try {
    const calendar = await getUncachableCalendarClient();
    
    const response = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId,
    });
    
    return response.data as CalendarEvent;
  } catch (error) {
    console.error('Error getting calendar event:', error);
    return null;
  }
}
