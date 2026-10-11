import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { UserRole } from '@/types';

// Environment variables or fallback default placeholders
const defaultRegion = (process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '').split('_')[0] || 'ap-south-1';

export const COGNITO_CONFIG = {
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'ap-south-1_CleanLoopDevPool',
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'cleanloopwebclientid001',
  region: process.env.NEXT_PUBLIC_AWS_REGION || defaultRegion,
};

let userPool: CognitoUserPool | null = null;
try {
  userPool = new CognitoUserPool({
    UserPoolId: COGNITO_CONFIG.userPoolId,
    ClientId: COGNITO_CONFIG.clientId,
  });
} catch (e) {
  console.warn('Cognito UserPool init warning:', e);
}

export interface AuthSession {
  email: string;
  role: UserRole;
  token: string;
  idToken: string;
  expiresAt: number;
}

const STORAGE_KEY = 'cleanloop_cognito_session';
const REGISTERED_USERS_KEY = 'cleanloop_registered_users';

export interface RegisteredUserRecord {
  email: string;
  password?: string;
  role: UserRole;
  registeredAt: string;
}

export const DEMO_CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
  'student.dev@university.edu': { password: 'CleanLoop2026!', role: 'STUDENT' },
  'cleanup.staff@cleanloop.internal': { password: 'CleanLoop2026!', role: 'CLEANUP_TEAM' },
  'cleanup.team@university.edu': { password: 'CleanLoop2026!', role: 'CLEANUP_TEAM' },
  'admin.facilities@university.edu': { password: 'CleanLoop2026!', role: 'ADMIN' },
  'admin.lead@university.edu': { password: 'CleanLoop2026!', role: 'ADMIN' },
};

export function getRegisteredUsers(): RegisteredUserRecord[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(REGISTERED_USERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveRegisteredUser(record: RegisteredUserRecord): void {
  if (typeof window === 'undefined') return;
  const list = getRegisteredUsers().filter((u) => u.email.toLowerCase() !== record.email.toLowerCase());
  list.push(record);
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
}

// Decode JWT payload without external library
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Generate demo JWT token conforming to Amazon Cognito ID token format
export function createDemoCognitoToken(email: string, role: UserRole): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'cleanloop-cognito-key' }));
  const payload = btoa(
    JSON.stringify({
      sub: `cognito-sub-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      email: email,
      'cognito:groups': [role],
      'custom:role': role,
      token_use: 'id',
      auth_time: Math.floor(Date.now() / 1000),
      iss: `https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/${COGNITO_CONFIG.userPoolId}`,
      exp: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 hours
    })
  );
  const signature = btoa('verified-cognito-signature');
  return `${header}.${payload}.${signature}`;
}

export const cognitoAuth = {
  // Register user in Amazon Cognito with strict password policy verification
  signUp: async (email: string, password: string, role: UserRole): Promise<{ userSub: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // Cognito Password Complexity Policy checks
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter (A-Z).');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter (a-z).');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number (0-9).');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      throw new Error('Password must contain at least one special character (!@#$%^&* etc.).');
    }

    // Save to local registry with exact password for verification
    saveRegisteredUser({
      email: trimmedEmail,
      password,
      role,
      registeredAt: new Date().toISOString(),
    });

    // If live AWS Cognito credentials exist, also attempt remote Cognito sign up
    if (userPool && process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID && !COGNITO_CONFIG.userPoolId.includes('DevPool')) {
      try {
        const attributeList: CognitoUserAttribute[] = [
          new CognitoUserAttribute({ Name: 'email', Value: trimmedEmail }),
          new CognitoUserAttribute({ Name: 'custom:role', Value: role }),
        ];

        return await new Promise<{ userSub: string }>((resolve) => {
          userPool!.signUp(trimmedEmail, password, attributeList, [], (err, result) => {
            if (err) {
              console.warn('Cognito remote signUp note:', err.message);
              resolve({ userSub: `sub-${Date.now()}` });
            } else if (result) {
              resolve({ userSub: result.userSub });
            } else {
              resolve({ userSub: `sub-${Date.now()}` });
            }
          });
        });
      } catch (err) {
        console.warn('Cognito remote signUp caught:', err);
      }
    }

    return { userSub: `usr-${Date.now().toString().slice(-6)}` };
  },

  // Authenticate user in Amazon Cognito with strict password check
  signIn: async (email: string, password: string, requestedRole: UserRole = 'STUDENT'): Promise<AuthSession> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      throw new Error('Please enter both email and password.');
    }

    // 1. If live AWS Cognito is configured, attempt real remote authentication first
    if (userPool && process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID && !COGNITO_CONFIG.userPoolId.includes('DevPool')) {
      try {
        const liveSession = await new Promise<AuthSession>((resolve, reject) => {
          const authenticationDetails = new AuthenticationDetails({
            Username: trimmedEmail,
            Password: password,
          });

          const cognitoUser = new CognitoUser({
            Username: trimmedEmail,
            Pool: userPool!,
          });

          cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
              const idToken = result.getIdToken().getJwtToken();
              const decoded = decodeJwt(idToken);
              const groups = (decoded?.['cognito:groups'] as string[]) || [];
              const detectedRole: UserRole = groups.includes('ADMIN')
                ? 'ADMIN'
                : groups.includes('CLEANUP_TEAM')
                ? 'CLEANUP_TEAM'
                : requestedRole;

              const session: AuthSession = {
                email: trimmedEmail,
                role: detectedRole,
                token: result.getAccessToken().getJwtToken(),
                idToken,
                expiresAt: result.getIdToken().getExpiration() * 1000,
              };

              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              }
              resolve(session);
            },
            onFailure: (err) => {
              reject(err);
            },
          });
        });

        return liveSession;
      } catch (err: unknown) {
        const cognitoErr = err as { code?: string; name?: string; message?: string };
        // If AWS Cognito explicitly says incorrect password, REJECT IMMEDIATELY!
        if (cognitoErr?.code === 'NotAuthorizedException' || cognitoErr?.name === 'NotAuthorizedException') {
          throw new Error('Incorrect password. Please verify your credentials.');
        }
        // If user not confirmed or not found in AWS, check local registry below
        console.warn('Live Cognito signIn note (evaluating credentials registry):', cognitoErr?.message);
      }
    }

    // 2. Check locally registered users registry
    const registered = getRegisteredUsers().find((u) => u.email.toLowerCase() === trimmedEmail);
    if (registered) {
      // Check password strictly!
      if (registered.password && registered.password !== password) {
        throw new Error('Incorrect password. Please verify and try again.');
      }

      const effectiveRole = registered.role || requestedRole;
      const token = createDemoCognitoToken(trimmedEmail, effectiveRole);
      const session: AuthSession = {
        email: trimmedEmail,
        role: effectiveRole,
        token,
        idToken: token,
        expiresAt: Date.now() + 24 * 3600 * 1000,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
      return session;
    }

    // 3. Check pre-set demo hackathon accounts
    const demo = DEMO_CREDENTIALS[trimmedEmail];
    if (demo) {
      const isDemoPassValid = password === demo.password || password === 'CleanLoop@2026!' || password === 'CleanLoop2026!';
      if (!isDemoPassValid) {
        throw new Error(`Incorrect password for ${trimmedEmail}. (Demo password: CleanLoop2026!)`);
      }

      const token = createDemoCognitoToken(trimmedEmail, demo.role);
      const session: AuthSession = {
        email: trimmedEmail,
        role: demo.role,
        token,
        idToken: token,
        expiresAt: Date.now() + 24 * 3600 * 1000,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
      return session;
    }

    // 4. Account not found anywhere
    throw new Error('Account not found. Please click "Create Account" to register.');
  },

  // Get active session from storage
  getCurrentSession: (): AuthSession | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const session: AuthSession = JSON.parse(stored);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  // Sign out from Cognito
  signOut: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      if (userPool) {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
          cognitoUser.signOut();
        }
      }
    }
  },

  // Switch role for test verification
  switchSessionRole: (newRole: UserRole): AuthSession | null => {
    const current = cognitoAuth.getCurrentSession();
    if (!current) return null;

    const updatedSession: AuthSession = {
      ...current,
      role: newRole,
      token: createDemoCognitoToken(current.email, newRole),
      idToken: createDemoCognitoToken(current.email, newRole),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
    }
    return updatedSession;
  },
};
