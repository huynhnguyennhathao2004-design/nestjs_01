import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { Request } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

interface JwtAccessPayload {
  sub: string;
  email?: string;
  role?: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

type AuthenticatedRequest =
  Request & {
    user?: AuthenticatedUser;
  };

@Injectable()
export class JwtAuthGuard
  implements CanActivate
{
  constructor(
    private readonly jwtService:
      JwtService,

    private readonly prisma:
      PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const accessToken =
      this.extractBearerToken(
        request,
      );

    if (!accessToken) {
      throw new UnauthorizedException(
        'Vui lòng đăng nhập để tiếp tục.',
      );
    }

    let payload:
      JwtAccessPayload;

    try {
      payload =
        await this.jwtService
          .verifyAsync<JwtAccessPayload>(
            accessToken,
          );
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
      );
    }

    if (
      !payload.sub ||
      !Number.isInteger(
        payload.tokenVersion,
      )
    ) {
      /*
       * JWT được tạo trước khi hệ thống
       * có tokenVersion cũng bị từ chối.
       */
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
      );
    }

    const user =
      await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          deletedAt: null,
        },

        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          status: true,
          tokenVersion: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Không tìm thấy tài khoản.',
      );
    }

    /*
     * Đây là phần quan trọng nhất:
     * JWT cũ không còn hợp lệ nếu
     * tokenVersion trong database đã tăng.
     */
    if (
      payload.tokenVersion !==
      user.tokenVersion
    ) {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.',
      );
    }

    if (
      user.status === 'LOCKED'
    ) {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
      );
    }

    if (
      user.status === 'UNVERIFIED'
    ) {
      throw new ForbiddenException(
        'Tài khoản chưa được xác minh.',
      );
    }

    if (
      user.status === 'DISABLED'
    ) {
      throw new ForbiddenException(
        'Tài khoản đã bị vô hiệu hóa.',
      );
    }

    if (
      user.status !== 'ACTIVE'
    ) {
      throw new ForbiddenException(
        'Tài khoản hiện không thể sử dụng.',
      );
    }

    request.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      emailVerifiedAt:
        user.emailVerifiedAt,
      lastLoginAt:
        user.lastLoginAt,
      createdAt:
        user.createdAt,
      updatedAt:
        user.updatedAt,
    };

    return true;
  }

  private extractBearerToken(
    request: Request,
  ): string {
    const authorization =
      request.headers.authorization;

    if (!authorization) {
      return '';
    }

    const [
      scheme,
      token,
    ] =
      authorization
        .trim()
        .split(/\s+/);

    if (
      scheme.toLowerCase() !==
        'bearer' ||
      !token
    ) {
      return '';
    }

    return token;
  }
}