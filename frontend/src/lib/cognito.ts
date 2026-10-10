import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { UserRole } from '@/types';

// Environment variables or fallback default placeholders
export const COGNITO_CONFIG = {
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_CleanLoopDevPool',
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'cleanloopwebclientid001',
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
};

const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_CONFIG.userPoolId,
  ClientId: COGNITO_CONFIG.clientId,
});

export interface AuthSession {
  email: string;
  role: UserRole;
  token: string;
  idToken: string;
  expiresAt: number;
}

const STORAGE_KEY = 'cleanloop_cognito_session';

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
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'demo-cleanloop-key' }));
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
  const signature = btoa('demo-mock-cognito-signature');
  return `${header}.${payload}.${signature}`;
}

export const cognitoAuth = {
  // Register user in Amazon Cognito
  signUp: async (email: string, password: string, role: UserRole): Promise<{ userSub: string }> => {
    // If running against an active AWS deployed user pool
    if (process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID && !COGNITO_CONFIG.userPoolId.includes('DevPool')) {
      return new Promise((resolve, reject) => {
        const attributeList: CognitoUserAttribute[] = [
          new CognitoUserAttribute({ Name: 'email', Value: email }),
          new CognitoUserAttribute({ Name: 'custom:role', Value: role }),
        ];

        userPool.signUp(email, password, attributeList, [], (err, result) => {
          if (err) {
            reject(err);
          } else if (result) {
            resolve({ userSub: result.userSub });
          } else {
            reject(new Error('Unknown sign up error'));
          }
        });
      });
    }

    // Dev/Local fallback: deterministic simulation of Cognito user creation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ userSub: `usr-${Date.now().toString().slice(-6)}` });
      }, 400);
    });
  },

  // Authenticate user in Amazon Cognito
  signIn: async (email: string, password: string, requestedRole: UserRole = 'STUDENT'): Promise<AuthSession> => {
    // If live AWS Cognito credentials are configured
    if (process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID && !COGNITO_CONFIG.userPoolId.includes('DevPool')) {
      return new Promise((resolve, reject) => {
        const authenticationDetails = new AuthenticationDetails({
          Username: email,
          Password: password,
        });

        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: userPool,
        });

        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: (result) => {
            const idToken = result.getIdToken().getJwtToken();
            const decoded = decodeJwt(idToken);
            const groups = (decoded?.['cognito:groups'] as string[]) || [];
            const role: UserRole = groups.includes('ADMIN')
              ? 'ADMIN'
              : groups.includes('CLEANUP_TEAM')
              ? 'CLEANUP_TEAM'
              : 'STUDENT';

            const session: AuthSession = {
              email,
              role,
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
    }

    // Dev mode Cognito token synthesis
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = createDemoCognitoToken(email, requestedRole);
        const session: AuthSession = {
          email,
          role: requestedRole,
          token,
          idToken: token,
          expiresAt: Date.now() + 24 * 3600 * 1000,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        }
        resolve(session);
      }, 400);
    });
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
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
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
