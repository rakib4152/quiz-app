import { Auth0User } from '../types/architecture';
import {
  AUTH0_PRESET_USERS,
  generateAuth0Jwt,
  verifyAndDecodeAuth0Token,
} from '../services/auth0/auth0Service';
import { runMiddlewarePipeline } from '../middleware';

export class AuthController {
  /**
   * Handle user login via Auth0 Universal Login / Token generation
   */
  public static async login(userId: string = 'usr-student-pro') {
    const user: Auth0User = AUTH0_PRESET_USERS[userId] || AUTH0_PRESET_USERS['usr-student-free'];
    const token = generateAuth0Jwt(user);

    return {
      success: true,
      user,
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 86400,
      scope: 'openid profile email read:quizzes attempt:quizzes access:pro_content',
    };
  }

  /**
   * Verify and introspect current access token
   */
  public static async introspectToken(token: string) {
    const decoded = verifyAndDecodeAuth0Token(token);
    return {
      active: decoded.isValid,
      payload: decoded.payload,
      error: decoded.error,
    };
  }

  /**
   * Get authenticated user profile with claims
   */
  public static async getProfile(req: { headers: Record<string, string>; method?: string; ip?: string }) {
    const pipeline = runMiddlewarePipeline({ method: req.method || 'GET', headers: req.headers, ip: req.ip });
    if (!pipeline.passed) {
      return { error: pipeline.errorResponse, statusCode: pipeline.errorResponse?.status };
    }

    const { ctx } = pipeline;
    return {
      success: true,
      auth: ctx.auth,
      correlationId: ctx.correlationId,
    };
  }
}
