import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import type { UserRecord } from './airtable/tables/users';
import { getUserByGoogleId, createUser, getUserById } from './airtable/tables/users';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';

export const GOOGLE_AUTH_ENABLED = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

if (!GOOGLE_AUTH_ENABLED) {
  console.warn('⚠️  Google OAuth not configured. Using development mode with auto-login.');
  console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for production use.');
}

// Configure Passport to serialize user to session
passport.serializeUser((user: any, done) => {
  // Store only the Airtable record ID in session
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configure Google OAuth strategy (only if credentials provided)
if (GOOGLE_AUTH_ENABLED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/analytics.readonly',
        ],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleUid = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || email?.split('@')[0] || 'User';

          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Check if user already exists
          let user = await getUserByGoogleId(googleUid);

          if (!user) {
            // Create new user
            user = await createUser({
              name,
              email,
              googleUid,
            });

            console.log(`✅ New user created: ${email} (${user.id})`);
          } else {
            console.log(`✅ Existing user logged in: ${email} (${user.id})`);
          }

          // Store tokens for API access (could be saved to Airtable if needed)
          (user as any).accessToken = accessToken;
          (user as any).refreshToken = refreshToken;

          return done(null, user);
        } catch (error) {
          console.error('Error in Google OAuth strategy:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export { passport };
