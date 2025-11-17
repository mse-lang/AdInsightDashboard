import fs from 'fs';
import path from 'path';
import { JWT } from 'google-auth-library';
import { google, calendar_v3 } from 'googleapis';
import type { CampaignRecord } from '../airtable/tables/campaigns';
import type { AdvertiserRecord } from '../airtable/tables/advertisers';

const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar'];

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

interface GoogleCalendarAccessError extends Error {
  status?: number;
  details?: unknown;
}

let cachedServiceAccountCredentials: ServiceAccountCredentials | null | undefined;
let serviceAccountAuthClient: JWT | null = null;
let serviceAccountCalendarClient: calendar_v3.Calendar | null = null;
let connectionSettings: any;

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

function parseCredentials(jsonString: string | undefined | null): ServiceAccountCredentials | null {
  if (!jsonString) {
    return null;
  }
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed?.client_email && parsed?.private_key) {
      return {
        client_email: parsed.client_email,
        private_key: normalizePrivateKey(parsed.private_key),
      };
    }
  } catch (error) {
    console.warn('Failed to parse Google Calendar credentials JSON from environment:', error);
  }
  return null;
}

function resolveServiceAccountCredentials(): ServiceAccountCredentials | null {
  if (cachedServiceAccountCredentials !== undefined) {
    return cachedServiceAccountCredentials;
  }

  const envClientEmail =
    process.env.GOOGLE_CALENDAR_CLIENT_EMAIL ||
    process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const envPrivateKey =
    process.env.GOOGLE_CALENDAR_PRIVATE_KEY ||
    process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (envClientEmail && envPrivateKey) {
    cachedServiceAccountCredentials = {
      client_email: envClientEmail,
      private_key: normalizePrivateKey(envPrivateKey),
    };
    return cachedServiceAccountCredentials;
  }

  const credentialsFromEnvJson =
    process.env.GOOGLE_CALENDAR_CREDENTIALS ||
    process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_CREDENTIALS ||
    process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

  const parsedFromEnv = parseCredentials(credentialsFromEnvJson ?? null);
  if (parsedFromEnv) {
    cachedServiceAccountCredentials = parsedFromEnv;
    return cachedServiceAccountCredentials;
  }

  const credentialsPath =
    process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH ||
    process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH ||
    path.resolve(process.cwd(), 'server/google-credentials.json');

  if (fs.existsSync(credentialsPath)) {
    try {
      const raw = fs.readFileSync(credentialsPath, 'utf-8');
      const parsed = parseCredentials(raw);
      if (parsed) {
        cachedServiceAccountCredentials = parsed;
        return cachedServiceAccountCredentials;
      }
    } catch (error) {
      console.warn('Failed to read Google Calendar credentials file:', error);
    }
  }

  cachedServiceAccountCredentials = null;
  return cachedServiceAccountCredentials;
}

async function getServiceAccountCalendarClient(): Promise<calendar_v3.Calendar | null> {
  const credentials = resolveServiceAccountCredentials();
  if (!credentials) {
    return null;
  }

  if (!serviceAccountAuthClient) {
    serviceAccountAuthClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: CALENDAR_SCOPES,
      subject: process.env.GOOGLE_CALENDAR_IMPERSONATE_EMAIL || undefined,
    });
  }

  await serviceAccountAuthClient.authorize();

  if (!serviceAccountCalendarClient) {
    serviceAccountCalendarClient = google.calendar({
      version: 'v3',
      auth: serviceAccountAuthClient,
    });
  }

  return serviceAccountCalendarClient;
}

function isGoogleApiError(error: unknown): error is { response?: { status?: number; data?: any }; message?: string } {
  return typeof error === 'object' && error !== null && 'response' in error;
}

function mapGoogleApiError(error: unknown, fallbackMessage: string): GoogleCalendarAccessError {
  if (isGoogleApiError(error)) {
    const status = error.response?.status ?? 500;
    const rawMessage =
      (error.response?.data?.error?.message as string | undefined) ||
      (error as { message?: string }).message ||
      fallbackMessage;
    const message =
      status === 401 || status === 403
        ? 'Google Calendar 접근 권한이 없습니다. 캘린더 공유 설정을 확인해주세요.'
        : rawMessage;
    const mapped: GoogleCalendarAccessError = new Error(message);
    mapped.status = status;
    mapped.details = error.response?.data ?? rawMessage;
    return mapped;
  }

  const fallbackError: GoogleCalendarAccessError =
    error instanceof Error ? (error as GoogleCalendarAccessError) : new Error(fallbackMessage);
  if (fallbackError.status === undefined) {
    fallbackError.status = 500;
  }
  if (fallbackError.details === undefined) {
    fallbackError.details = fallbackError.message || fallbackMessage;
  }
  return fallbackError;
}

async function getConnectorAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    const cachedToken = connectionSettings.settings.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
    if (cachedToken) {
      return cachedToken;
    }
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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleCalendarClient() {
  const errors: Error[] = [];

  try {
    const serviceAccountClient = await getServiceAccountCalendarClient();
    if (serviceAccountClient) {
      return serviceAccountClient;
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    errors.push(err);
  }

  try {
    const accessToken = await getConnectorAccessToken();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken,
    });
    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    errors.push(err);
  }

  const errorMessage = errors.length
    ? `Google Calendar not configured: ${errors.map((err) => err.message).join('; ')}`
    : 'Google Calendar not configured';

  const combinedError: GoogleCalendarAccessError = new Error(errorMessage);
  combinedError.details = errors;
  throw combinedError;
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
  lines.push(`[캠페인] ${campaign.fields['Campaign Name']}`);
  lines.push(`[기간] ${campaign.fields['Start Date']} ~ ${campaign.fields['End Date']}`);
  lines.push(`[상태] ${campaign.fields['Status']}`);
  lines.push(`[파이프라인] ${campaign.fields['Pipeline Status']}`);
  
  if (campaign.fields['UTM Campaign']) {
    lines.push(`[UTM] ${campaign.fields['UTM Campaign']}`);
  }
  
  lines.push('');
  
  // Advertiser Info
  if (advertiser) {
    lines.push('[광고주 정보]');
    lines.push(`  회사명: ${advertiser.fields['Company Name']}`);
    if (advertiser.fields['Contact Name']) {
      lines.push(`  담당자: ${advertiser.fields['Contact Name']}`);
    }
    if (advertiser.fields['Email']) {
      lines.push(`  이메일: ${advertiser.fields['Email']}`);
    }
    if (advertiser.fields['Phone']) {
      lines.push(`  전화: ${advertiser.fields['Phone']}`);
    }
    lines.push('');
  }
  
  // Ad Products
  if (adProducts && adProducts.length > 0) {
    lines.push('[광고 상품]');
    adProducts.forEach((product, index) => {
      lines.push(`  ${index + 1}. ${product.fields?.['Product Name'] || '상품 정보 없음'}`);
    });
    lines.push('');
  }
  
  // Creatives count
  const creativesCount = campaign.fields['Creatives']?.length || 0;
  if (creativesCount > 0) {
    lines.push(`[크리에이티브] ${creativesCount}개`);
  }
  
  // Reports count
  const reportsCount = campaign.fields['Reports']?.length || 0;
  if (reportsCount > 0) {
    lines.push(`[리포트] ${reportsCount}개`);
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
  htmlLink?: string;
  status?: string;
  location?: string;
  organizer?: {
    displayName?: string;
    email?: string;
  };
  attendees?: Array<{
    displayName?: string;
    email?: string;
    responseStatus?: string;
  }>;
  hangoutLink?: string;
  created?: string;
  updated?: string;
}

/**
 * Get the configured calendar ID from environment or use default
 */
function getCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

export interface ListCalendarEventsOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
  q?: string;
  showDeleted?: boolean;
  timeZone?: string;
}

export async function listCalendarEvents(
  options: ListCalendarEventsOptions = {},
  calendarId?: string
): Promise<CalendarEvent[]> {
  const targetCalendarId = calendarId || getCalendarId();
  try {
    const calendar = await getUncachableGoogleCalendarClient();

    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId: targetCalendarId,
      singleEvents: options.singleEvents ?? true,
      orderBy: options.orderBy ?? 'startTime',
      maxResults: options.maxResults ?? 200,
      timeMin: options.timeMin,
      timeMax: options.timeMax,
      q: options.q,
      showDeleted: options.showDeleted ?? false,
      timeZone: options.timeZone ?? 'Asia/Seoul',
    };

    const response = await calendar.events.list(params);

    const events = response.data.items ?? [];

    return events
      .filter((event): event is calendar_v3.Schema$Event => Boolean(event && event.id))
      .map((event) => ({
        id: event.id!,
        summary: event.summary ?? '제목 없음',
        description: event.description ?? undefined,
        start: {
          date: event.start?.date ?? undefined,
          dateTime: event.start?.dateTime ?? undefined,
          timeZone: event.start?.timeZone ?? undefined,
        },
        end: {
          date: event.end?.date ?? undefined,
          dateTime: event.end?.dateTime ?? undefined,
          timeZone: event.end?.timeZone ?? undefined,
        },
        htmlLink: event.htmlLink ?? undefined,
        status: event.status ?? undefined,
        location: event.location ?? undefined,
        organizer: event.organizer
          ? {
              displayName: event.organizer.displayName ?? undefined,
              email: event.organizer.email ?? undefined,
            }
          : undefined,
        attendees: event.attendees?.map((attendee) => ({
          displayName: attendee.displayName ?? undefined,
          email: attendee.email ?? undefined,
          responseStatus: attendee.responseStatus ?? undefined,
        })),
        hangoutLink: event.hangoutLink ?? undefined,
        created: event.created ?? undefined,
        updated: event.updated ?? undefined,
      }));
  } catch (error) {
    console.error('Error listing calendar events:', error);
    throw mapGoogleApiError(error, 'Google Calendar 이벤트를 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * Create a calendar event from campaign data
 */
export async function createCampaignEvent(
  campaign: CampaignRecord,
  advertiser: AdvertiserRecord | null,
  adProducts?: any[],
  calendarId?: string
): Promise<CalendarEvent> {
  const targetCalendarId = calendarId || getCalendarId();
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const description = formatCampaignDescription(campaign, advertiser, adProducts);
    
    // Google Calendar all-day events use exclusive end dates
    // So we need to add 1 day to the end date to include the last day
    const endDate = new Date(campaign.fields['End Date']);
    endDate.setDate(endDate.getDate() + 1);
    const endDateString = endDate.toISOString().split('T')[0];
    
    const event = {
      summary: `[광고] ${campaign.fields['Campaign Name']}`,
      description: description,
      start: {
        date: campaign.fields['Start Date'],
        timeZone: 'Asia/Seoul',
      },
      end: {
        date: endDateString,
        timeZone: 'Asia/Seoul',
      },
      colorId: '11', // Red color for advertising campaigns
    };
    
    const response = await calendar.events.insert({
      calendarId: targetCalendarId,
      requestBody: event,
    });
    
    return response.data as CalendarEvent;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw mapGoogleApiError(error, 'Google Calendar 이벤트를 생성하지 못했습니다.');
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
  calendarId?: string
): Promise<CalendarEvent> {
  const targetCalendarId = calendarId || getCalendarId();
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const description = formatCampaignDescription(campaign, advertiser, adProducts);
    
    // Google Calendar all-day events use exclusive end dates
    // So we need to add 1 day to the end date to include the last day
    const endDate = new Date(campaign.fields['End Date']);
    endDate.setDate(endDate.getDate() + 1);
    const endDateString = endDate.toISOString().split('T')[0];
    
    const event = {
      summary: `[광고] ${campaign.fields['Campaign Name']}`,
      description: description,
      start: {
        date: campaign.fields['Start Date'],
        timeZone: 'Asia/Seoul',
      },
      end: {
        date: endDateString,
        timeZone: 'Asia/Seoul',
      },
      colorId: '11',
    };
    
    const response = await calendar.events.update({
      calendarId: targetCalendarId,
      eventId: eventId,
      requestBody: event,
    });
    
    return response.data as CalendarEvent;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw mapGoogleApiError(error, 'Google Calendar 이벤트를 업데이트하지 못했습니다.');
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCampaignEvent(
  eventId: string,
  calendarId?: string
): Promise<void> {
  const targetCalendarId = calendarId || getCalendarId();
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    
    await calendar.events.delete({
      calendarId: targetCalendarId,
      eventId: eventId,
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw mapGoogleApiError(error, 'Google Calendar 이벤트를 삭제하지 못했습니다.');
  }
}

/**
 * Get calendar event by ID
 */
export async function getCalendarEvent(
  eventId: string,
  calendarId?: string
): Promise<CalendarEvent | null> {
  const targetCalendarId = calendarId || getCalendarId();
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const response = await calendar.events.get({
      calendarId: targetCalendarId,
      eventId: eventId,
    });
    
    return response.data as CalendarEvent;
  } catch (error) {
    console.error('Error getting calendar event:', error);
    return null;
  }
}
