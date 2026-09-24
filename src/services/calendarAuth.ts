import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

export const SCOPES = CALENDAR_SCOPES;

// Initialize or reuse Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider with Calendar Events scope
const provider = new GoogleAuthProvider();
CALENDAR_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

// Prompt select account / consent
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
// Token cached ONLY in memory as strictly required by Workspace integration guidelines
let cachedAccessToken: string | null = null;

/**
 * Initialize calendar auth state listener.
 */
export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If user is logged into Firebase Auth but cached in-memory token is absent,
        // trigger sign-in or wait for user explicit trigger
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign-In with Calendar scope from a user click.
 */
export const signInWithGoogleCalendar = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('لم يتم استلام مفتاح الوصول (Access Token) من حساب Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Calendar sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve cached token in memory.
 */
export const getCalendarAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Disconnect / Logout from Google Calendar session.
 */
export const logoutGoogleCalendar = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};
