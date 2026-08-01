import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import type {
  AuthenticatedUser,
} from '../../auth/interfaces/authenticated-user.interface';

type AdminRequest =
  Request & {
    user?: AuthenticatedUser;
  };

@Injectable()
export class AdminGuard
  implements CanActivate
{
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context
        .switchToHttp()
        .getRequest<AdminRequest>();

    const user =
      request.user;

    if (!user) {
      throw new UnauthorizedException(
        'Vui lòng đăng nhập để tiếp tục.',
      );
    }

    if (
      String(user.role)
        .toUpperCase() !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền quản trị hệ thống.',
      );
    }

    if (
      String(user.status)
        .toUpperCase() !== 'ACTIVE'
    ) {
      throw new ForbiddenException(
        'Tài khoản quản trị hiện không hoạt động.',
      );
    }

    return true;
  }
}