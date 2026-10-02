import { userService } from './userService';

export class UserController {
  public static getAllUsers() {
    return {
      success: true,
      service: 'user-service',
      data: userService.getUsers(),
    };
  }

  public static getUserById(userId: string) {
    const user = userService.getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return {
      success: true,
      service: 'user-service',
      data: user,
    };
  }

  public static register(name: string, email: string, role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' = 'STUDENT') {
    try {
      const user = userService.registerUser(name, email, role);
      return { success: true, service: 'user-service', data: user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public static checkProAccess(userId: string) {
    return {
      success: true,
      service: 'user-service',
      hasProAccess: userService.hasProAccess(userId),
    };
  }
}
