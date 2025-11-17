import crypto from 'crypto';
import type { Express, RequestHandler } from 'express';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { getUncachableResendClient } from './resendClient';

const ADMIN_EMAIL = 'ad@venturesquare.net';
const TOKEN_EXPIRY_MINUTES = 15;

declare module 'express-session' {
  interface SessionData {
    userId: number;
    email: string;
    // For Airtable-based auth
    userRecordId?: string;
    userRole?: 'Admin' | 'User' | 'ReadOnly';
  }
}

// In-memory token storage for development
// In production, consider using Airtable or Redis
interface AuthToken {
  token: string;
  email: string;
  expiresAt: Date;
  consumed: boolean;
}

const authTokenStore = new Map<string, AuthToken>();

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use MemoryStore for session management
  const MemoryStore = createMemoryStore(session);
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

export async function setupAuth(app: Express) {
  app.set('trust proxy', 1);
  app.use(getSession());
  
  // Import and initialize Passport for Google OAuth
  const { passport } = await import('./auth-google');
  app.use(passport.initialize());
  app.use(passport.session());
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const isAdminEmail: RequestHandler = async (req, res, next) => {
  if (!req.session.email || req.session.email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Forbidden - Admin access only' });
  }
  next();
};

export async function sendMagicLink(email: string, token: string): Promise<void> {
  try {
    console.log('[RESEND] Fetching Resend client...');
    const { client, fromEmail } = await getUncachableResendClient();
    console.log('[RESEND] Client obtained, from email:', fromEmail);
    
    const magicLink = `${process.env.REPLIT_DOMAINS?.split(',')[0] ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/verify?token=${token}`;
    console.log('[RESEND] Magic link created:', magicLink);
    
    console.log('[RESEND] Sending email to:', email);
    const result = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: '벤처스퀘어 광고 관리 시스템 로그인',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">벤처스퀘어 광고 관리 시스템</h2>
          <p style="color: #666; margin-bottom: 20px;">안녕하세요,</p>
          <p style="color: #666; margin-bottom: 20px;">아래 버튼을 클릭하여 로그인하세요. 이 링크는 ${TOKEN_EXPIRY_MINUTES}분 동안 유효합니다.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">로그인하기</a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            링크가 작동하지 않으면 아래 URL을 복사하여 브라우저에 붙여넣으세요:<br/>
            <span style="color: #666;">${magicLink}</span>
          </p>
        </div>
      `,
    });
    console.log('[RESEND] Email sent successfully, result:', result);
  } catch (error) {
    console.error('[RESEND] Error sending email:', error);
    if (error instanceof Error) {
      console.error('[RESEND] Error message:', error.message);
      console.error('[RESEND] Error stack:', error.stack);
    }
    throw error;
  }
}

export async function createAuthToken(email: string): Promise<string> {
  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  // Store in memory (replace with Airtable or Redis in production)
  authTokenStore.set(hashedToken, {
    token: hashedToken,
    email,
    expiresAt,
    consumed: false,
  });

  return token;
}

export async function verifyAuthToken(token: string): Promise<string | null> {
  const hashedToken = hashToken(token);
  const authToken = authTokenStore.get(hashedToken);

  if (!authToken) {
    return null;
  }

  if (authToken.consumed) {
    return null;
  }

  if (authToken.expiresAt < new Date()) {
    authTokenStore.delete(hashedToken);
    return null;
  }

  // Mark as consumed
  authToken.consumed = true;
  authTokenStore.set(hashedToken, authToken);
  
  return authToken.email;
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = new Date();
  for (const [key, token] of authTokenStore.entries()) {
    if (token.expiresAt < now) {
      authTokenStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
