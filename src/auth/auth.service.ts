import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(email: string, password: string) {
    const demoEmail = 'admin@gmail.com';
    const demoPassword = '123456';

    if (email === demoEmail && password === demoPassword) {
      return {
        success: true,
        message: 'Đăng nhập thành công',
        user: {
          name: 'Admin',
          email: demoEmail,
          role: 'admin',
        },
      };
    }

    throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
  }
}
