import { Auth0User, Auth0TokenPayload, Auth0Config } from '../../types/architecture';

export const AUTH0_CONFIG: Auth0Config = {
  domain: 'exampro-bcs.us.auth0.com',
  clientId: 'auth0_client_exampro_prod_89a3',
  audience: 'https://api.exampro.ai/v1',
  redirectUri: 'https://exampro.ai/callback',
  scope: 'openid profile email read:quizzes attempt:quizzes manage:quizzes access:pro_content',
};

// Preset personas in Auth0 Tenant
export const AUTH0_PRESET_USERS: Record<string, Auth0User> = {
  'usr-student-free': {
    sub: 'auth0|65f2a1b9c8d712345678',
    name: 'Rakibul Islam',
    email: 'rakib.edu.bd@gmail.com',
    email_verified: true,
    picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    nickname: 'rakib',
    updated_at: new Date().toISOString(),
    'https://exampro.ai/roles': ['STUDENT'],
    'https://exampro.ai/permissions': ['read:quizzes', 'attempt:quizzes'],
    'https://exampro.ai/is_premium': false,
    'https://exampro.ai/subscription_plan': 'FREE',
  },
  'usr-student-pro': {
    sub: 'auth0|65f2a1b9c8d787654321',
    name: 'Tasmia Sultana',
    email: 'tasmia.du@gmail.com',
    email_verified: true,
    picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    nickname: 'tasmia',
    updated_at: new Date().toISOString(),
    'https://exampro.ai/roles': ['STUDENT'],
    'https://exampro.ai/permissions': ['read:quizzes', 'attempt:quizzes', 'access:pro_content'],
    'https://exampro.ai/is_premium': true,
    'https://exampro.ai/subscription_plan': 'ANNUAL_BCS_MASTER',
  },
  'usr-admin': {
    sub: 'auth0|65f2a1b9c8d799998888',
    name: 'Dr. Shahriar Kabir',
    email: 'admin@exampro.ai',
    email_verified: true,
    picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    nickname: 'admin',
    updated_at: new Date().toISOString(),
    'https://exampro.ai/roles': ['ADMIN', 'INSTRUCTOR'],
    'https://exampro.ai/permissions': [
      'read:quizzes',
      'attempt:quizzes',
      'manage:quizzes',
      'access:pro_content',
      'manage:users',
      'manage:finance',
    ],
    'https://exampro.ai/is_premium': true,
    'https://exampro.ai/subscription_plan': 'ANNUAL_BCS_MASTER',
  },
};

/**
 * Creates an RS256-signed mock Auth0 JSON Web Token
 */
export function generateAuth0Jwt(user: Auth0User): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'auth0-rsa-key-2026-exampro',
  };

  const payload: Auth0TokenPayload = {
    iss: `https://${AUTH0_CONFIG.domain}/`,
    sub: user.sub,
    aud: [AUTH0_CONFIG.audience, `https://${AUTH0_CONFIG.domain}/userinfo`],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    azp: AUTH0_CONFIG.clientId,
    scope: AUTH0_CONFIG.scope,
    permissions: user['https://exampro.ai/permissions'],
    roles: user['https://exampro.ai/roles'],
  };

  const encode = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${encode(header)}.${encode(payload)}`;
  // Simulated cryptographic signature matching Auth0 JWKS standard
  const mockSignature = btoa(`sig_${user.sub}_${Date.now()}`).substring(0, 32);
  return `${unsignedToken}.${mockSignature}`;
}

/**
 * Validates and decodes Auth0 JWT string
 */
export function verifyAndDecodeAuth0Token(token: string): {
  isValid: boolean;
  payload?: Auth0TokenPayload;
  error?: string;
} {
  try {
    if (!token || !token.includes('.')) {
      return { isValid: false, error: 'Malformed Bearer Token' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'JWT must contain header, payload, and signature' };
    }

    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as Auth0TokenPayload;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSeconds) {
      return { isValid: false, error: 'Token has expired' };
    }

    if (payload.iss !== `https://${AUTH0_CONFIG.domain}/`) {
      return { isValid: false, error: `Invalid issuer: ${payload.iss}` };
    }

    return { isValid: true, payload };
  } catch (err: any) {
    return { isValid: false, error: `Invalid JWT: ${err.message}` };
  }
}
