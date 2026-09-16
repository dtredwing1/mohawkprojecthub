import { google } from 'googleapis';

export interface DriveConfig {
  clientId?: string;
  developerKey?: string;
  appId?: string;
  isConfigured: boolean;
}

export function getClientDriveConfig(): DriveConfig {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const developerKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID || process.env.GOOGLE_APP_ID;

  return {
    clientId,
    developerKey,
    appId,
    isConfigured: Boolean(clientId && developerKey),
  };
}

export function parseGoogleDriveUrl(url: string): { fileId?: string; type?: string; embedUrl?: string } {
  try {
    const parsed = new URL(url);
    let fileId: string | undefined;
    let type: string = 'generic';

    if (parsed.hostname.includes('docs.google.com')) {
      if (parsed.pathname.includes('/document/d/')) {
        fileId = parsed.pathname.split('/document/d/')[1]?.split('/')[0];
        type = 'google-doc';
      } else if (parsed.pathname.includes('/spreadsheets/d/')) {
        fileId = parsed.pathname.split('/spreadsheets/d/')[1]?.split('/')[0];
        type = 'google-sheet';
      } else if (parsed.pathname.includes('/presentation/d/')) {
        fileId = parsed.pathname.split('/presentation/d/')[1]?.split('/')[0];
        type = 'google-slide';
      }
    } else if (parsed.hostname.includes('drive.google.com')) {
      if (parsed.pathname.includes('/file/d/')) {
        fileId = parsed.pathname.split('/file/d/')[1]?.split('/')[0];
        type = 'drive-file';
      } else if (parsed.pathname.includes('/folders/')) {
        fileId = parsed.pathname.split('/folders/')[1]?.split('/')[0];
        type = 'drive-folder';
      }
    }

    let embedUrl: string | undefined;
    if (fileId) {
      if (type === 'google-doc') {
        embedUrl = `https://docs.google.com/document/d/${fileId}/preview`;
      } else if (type === 'google-sheet') {
        embedUrl = `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
      } else if (type === 'google-slide') {
        embedUrl = `https://docs.google.com/presentation/d/${fileId}/preview`;
      } else if (type === 'drive-file') {
        embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    return { fileId, type, embedUrl };
  } catch {
    return { type: 'generic' };
  }
}

export function getDriveServiceClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}
