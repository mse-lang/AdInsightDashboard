import { google } from 'googleapis';

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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export interface SurveyResponse {
  timestamp: string;
  companyName: string;
  email: string;
  phone: string;
  contactPerson: string;
  adBudget?: string;
  adType?: string;
  targetAudience?: string;
  additionalNotes?: string;
  rawData: string[];
}

export async function getSurveyResponses(limit: number = 10): Promise<SurveyResponse[]> {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    const spreadsheetId = '1UQnH5bGhmZIkQ_-WJil-vsibpjq0pmbophowGjLqhCE';
    const range = '설문지 응답 1!A:Z';
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    const sortedRows = dataRows.reverse().slice(0, limit);

    return sortedRows.map(row => {
      const getColumn = (index: number) => row[index] || '';
      
      return {
        timestamp: getColumn(0),
        companyName: getColumn(1),
        email: getColumn(2),
        phone: getColumn(3),
        contactPerson: getColumn(4),
        adBudget: getColumn(5),
        adType: getColumn(6),
        targetAudience: getColumn(7),
        additionalNotes: getColumn(8),
        rawData: row,
      };
    });
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    throw error;
  }
}
