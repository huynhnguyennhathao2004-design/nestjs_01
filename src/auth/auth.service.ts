import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import {
  createHash,
  randomBytes,
} from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import { UpdateProfileDto } from './dto/update-profile.dto';

import { ChangePasswordDto } from './dto/change-password.dto';

import { ForgotPasswordDto } from './dto/forgot-password.dto';

export interface AuthClientContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email
      .trim()
      .toLowerCase();

    const fullName = dto.fullName
      .trim()
      .replace(/\s+/g, ' ');

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        'Email này đã được sử dụng.',
      );
    }

    const passwordHash =
      await argon2.hash(dto.password, {
        type: argon2.argon2id,
      });

    try {
      const user =
        await this.prisma.user.create({
          data: {
            email,
            fullName,
            passwordHash,
            role: 'USER',
            status: 'ACTIVE',

            authAccounts: {
              create: {
                provider: 'LOCAL',
                providerAccountId: email,
              },
            },
          },

          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      return {
        success: true,
        message:
          'Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.',
        user: this.toPublicUser(user),
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email này đã được sử dụng.',
        );
      }

      throw error;
    }
  }

  async login(
    dto: LoginDto,
    client: AuthClientContext,
  ) {
    const email = dto.email
      .trim()
      .toLowerCase();

    const user =
      await this.prisma.user.findFirst({
        where: {
          email,
          deletedAt: null,
        },

        select: {
          id: true,
          email: true,
          fullName: true,
          passwordHash: true,
          avatarUrl: true,
          role: true,
          status: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          tokenVersion: true,
        },
      });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không đúng',
      );
    }

    const passwordMatches =
      await argon2.verify(
        user.passwordHash,
        dto.password,
      );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không đúng',
      );
    }

    this.assertActiveUser(user.status);

    const accessTokenData =
      await this.createAccessToken(user);

    const refreshToken =
      this.generateRefreshToken();

    const refreshTokenHash =
      this.hashRefreshToken(
        refreshToken,
      );

    const refreshTokenExpiresAt =
      this.createRefreshTokenExpiry();

    await this.prisma.$transaction([
      this.prisma.refreshSession.create({
        data: {
          userId: user.id,
          refreshTokenHash,
          ipAddress:
            this.normalizeIpAddress(
              client.ipAddress,
            ),
          userAgent:
            this.normalizeUserAgent(
              client.userAgent,
            ),
          expiresAt:
            refreshTokenExpiresAt,
        },
      }),

      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastLoginAt: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      message: 'Đăng nhập thành công',

      accessToken:
        accessTokenData.accessToken,

      tokenType: 'Bearer',

      expiresIn:
        accessTokenData.expiresIn,

      refreshToken,
      refreshTokenExpiresAt,

      user: this.toPublicUser(user),
    };
  }

  async refresh(
    rawRefreshToken: string,
    client: AuthClientContext,
  ) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException(
        'Không tìm thấy phiên đăng nhập.',
      );
    }

    const currentHash =
      this.hashRefreshToken(
        rawRefreshToken,
      );

    const session =
      await this.prisma.refreshSession.findUnique({
        where: {
          refreshTokenHash: currentHash,
        },

        select: {
          id: true,
          expiresAt: true,
          revokedAt: true,

          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              status: true,
              emailVerifiedAt: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
              tokenVersion: true,
            },
          },
        },
      });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <=
        Date.now() ||
      session.user.deletedAt
    ) {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
      );
    }

    this.assertActiveUser(
      session.user.status,
    );

    const nextRefreshToken =
      this.generateRefreshToken();

    const nextRefreshHash =
      this.hashRefreshToken(
        nextRefreshToken,
      );

    const nextRefreshExpiresAt =
      this.createRefreshTokenExpiry();

    await this.prisma.$transaction(
      async (transaction) => {
        const revoked =
          await transaction
            .refreshSession
            .updateMany({
              where: {
                id: session.id,
                revokedAt: null,
              },

              data: {
                revokedAt: new Date(),
              },
            });

        if (revoked.count !== 1) {
          throw new UnauthorizedException(
            'Phiên đăng nhập đã được sử dụng hoặc thu hồi.',
          );
        }

        await transaction
          .refreshSession
          .create({
            data: {
              userId:
                session.user.id,

              refreshTokenHash:
                nextRefreshHash,

              ipAddress:
                this.normalizeIpAddress(
                  client.ipAddress,
                ),

              userAgent:
                this.normalizeUserAgent(
                  client.userAgent,
                ),

              expiresAt:
                nextRefreshExpiresAt,
            },
          });
      },
    );

    const accessTokenData =
      await this.createAccessToken(
        session.user,
      );

    return {
      success: true,
      message:
        'Làm mới phiên đăng nhập thành công',

      accessToken:
        accessTokenData.accessToken,

      tokenType: 'Bearer',

      expiresIn:
        accessTokenData.expiresIn,

      refreshToken:
        nextRefreshToken,

      refreshTokenExpiresAt:
        nextRefreshExpiresAt,

      user: this.toPublicUser(
        session.user,
      ),
    };
  }

  async logout(
    rawRefreshToken:
      | string
      | undefined,
  ) {
    if (rawRefreshToken) {
      const refreshTokenHash =
        this.hashRefreshToken(
          rawRefreshToken,
        );

      await this.prisma
        .refreshSession
        .updateMany({
          where: {
            refreshTokenHash,
            revokedAt: null,
          },

          data: {
            revokedAt: new Date(),
          },
        });
    }

    return {
      success: true,
      message: 'Đăng xuất thành công',
    };
  }
async updateProfile(
  userId: string,
  dto: UpdateProfileDto,
) {
  const fullName = dto.fullName
    .trim()
    .replace(/\s+/g, ' ');

  if (fullName.length < 2) {
    throw new BadRequestException(
      'Họ và tên phải có ít nhất 2 ký tự.',
    );
  }

  const existingUser =
    await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

  if (!existingUser) {
    throw new NotFoundException(
      'Không tìm thấy tài khoản.',
    );
  }

  const user =
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        fullName,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  return {
    success: true,
    message: 'Cập nhật hồ sơ thành công.',
    user: this.toPublicUser(user),
  };
}
async changePassword(
  userId: string,
  dto: ChangePasswordDto,
) {
  const user =
    await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },

      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });

  if (!user) {
    throw new NotFoundException(
      'Không tìm thấy tài khoản.',
    );
  }

  this.assertActiveUser(
    user.status,
  );

  if (!user.passwordHash) {
    throw new BadRequestException(
      'Tài khoản này không sử dụng mật khẩu cục bộ.',
    );
  }

  const currentPasswordMatches =
    await argon2.verify(
      user.passwordHash,
      dto.currentPassword,
    );

  if (!currentPasswordMatches) {
    /*
     * Trả về 400 thay vì 401 để
     * AuthStore.authFetch không hiểu nhầm
     * access token đã hết hạn và tự refresh.
     */
    throw new BadRequestException(
      'Mật khẩu hiện tại không đúng.',
    );
  }

  if (
    dto.newPassword !==
    dto.confirmNewPassword
  ) {
    throw new BadRequestException(
      'Mật khẩu xác nhận không khớp.',
    );
  }

  const sameAsCurrentPassword =
    await argon2.verify(
      user.passwordHash,
      dto.newPassword,
    );

  if (sameAsCurrentPassword) {
    throw new BadRequestException(
      'Mật khẩu mới phải khác mật khẩu hiện tại.',
    );
  }

  const newPasswordHash =
    await argon2.hash(
      dto.newPassword,
      {
        type: argon2.argon2id,
      },
    );

  const revokedAt =
    new Date();

  await this.prisma.$transaction([
    this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        passwordHash:
          newPasswordHash,

        tokenVersion: {
          increment: 1,
        },
      },
    }),

    this.prisma.refreshSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },

      data: {
        revokedAt,
      },
    }),
  ]);

  return {
    success: true,

    message:
      'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',

    mustLoginAgain: true,
  };
}

async requestPasswordReset(
  dto: ForgotPasswordDto,
) {
  const email = dto.email
    .trim()
    .toLowerCase();

  /*
   * Luôn trả cùng một thông báo,
   * kể cả email không tồn tại.
   */
  const publicResult = {
    success: true,

    message:
      'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi.',
  };

  const user =
    await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },

      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });

  /*
   * Không tiết lộ email không tồn tại,
   * tài khoản không dùng mật khẩu local
   * hoặc tài khoản đã bị vô hiệu hóa.
   */
  if (
    !user ||
    !user.passwordHash ||
    user.status === 'DISABLED'
  ) {
    return publicResult;
  }

  const rawToken =
    randomBytes(32)
      .toString('base64url');

  const tokenHash =
    this.hashPasswordResetToken(
      rawToken,
    );

  const expiresAt =
    new Date(
      Date.now() +
        this
          .getPasswordResetExpiresInMinutes() *
          60 *
          1000,
    );

  const invalidatedAt =
    new Date();

  /*
   * Khi yêu cầu token mới:
   * token cũ chưa sử dụng sẽ bị đánh dấu usedAt.
   */
  await this.prisma.$transaction([
    this.prisma
      .passwordResetToken
      .updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },

        data: {
          usedAt: invalidatedAt,
        },
      }),

    this.prisma
      .passwordResetToken
      .create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
  ]);

  const resetUrl =
    this.createPasswordResetUrl(
      rawToken,
    );

  /*
   * Chỉ trả token ra khi chạy local.
   * Production tuyệt đối không trả token
   * trong response API.
   */
  if (
    this.configService
      .get<string>('NODE_ENV') ===
    'production'
  ) {
    return publicResult;
  }

  return {
    ...publicResult,

    debug: {
      resetUrl,
      expiresAt,
    },
  };
}
  private async createAccessToken(
  user: {
    id: string;
    email: string;
    role: string;
    tokenVersion: number;
  },
) {
  const expiresIn =
    this.getAccessTokenExpiresInSeconds();

  const accessToken =
    await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,

        /*
         * Phiên bản xác thực tại thời điểm
         * access token được tạo.
         */
        tokenVersion:
          user.tokenVersion,
      },
      {
        expiresIn,
      },
    );

  return {
    accessToken,
    expiresIn,
  };
}
  private assertActiveUser(
    status: string,
  ): void {
    if (status === 'LOCKED') {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
      );
    }

    if (status === 'UNVERIFIED') {
      throw new ForbiddenException(
        'Tài khoản chưa được xác minh.',
      );
    }

    if (status === 'DISABLED') {
      throw new ForbiddenException(
        'Tài khoản đã bị vô hiệu hóa.',
      );
    }

    if (status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Tài khoản hiện không thể sử dụng.',
      );
    }
  }

  private generateRefreshToken(): string {
    return randomBytes(48)
      .toString('base64url');
  }

  private hashRefreshToken(
    token: string,
  ): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private createRefreshTokenExpiry(): Date {
    const days =
      this.getRefreshTokenExpiresInDays();

    return new Date(
      Date.now() +
        days *
          24 *
          60 *
          60 *
          1000,
    );
  }

  private getRefreshTokenExpiresInDays(): number {
    const configured =
      Number(
        this.configService.get<string>(
          'REFRESH_TOKEN_EXPIRES_IN_DAYS',
        ) ?? 30,
      );

    if (
      !Number.isInteger(configured) ||
      configured < 1 ||
      configured > 365
    ) {
      return 30;
    }

    return configured;
  }

  private getAccessTokenExpiresInSeconds(): number {
    const configured =
      Number(
        this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN_SECONDS',
        ) ?? 900,
      );

    if (
      !Number.isInteger(configured) ||
      configured <= 0
    ) {
      return 900;
    }

    return configured;
  }

  private normalizeIpAddress(
    value: string | undefined,
  ): string | null {
    const normalized =
      String(value || '').trim();

    return normalized
      ? normalized.slice(0, 64)
      : null;
  }

  private normalizeUserAgent(
    value: string | undefined,
  ): string | null {
    const normalized =
      String(value || '').trim();

    return normalized
      ? normalized.slice(0, 1000)
      : null;
  }


private hashPasswordResetToken(
  token: string,
): string {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

private getPasswordResetExpiresInMinutes(): number {
  const configured =
    Number(
      this.configService.get<string>(
        'PASSWORD_RESET_EXPIRES_IN_MINUTES',
      ) ?? 30,
    );

  if (
    !Number.isInteger(configured) ||
    configured < 5 ||
    configured > 1440
  ) {
    return 30;
  }

  return configured;
}

private createPasswordResetUrl(
  token: string,
): string {
  const configuredBaseUrl =
    this.configService.get<string>(
      'APP_BASE_URL',
    ) ||
    'http://localhost:3000';

  const baseUrl =
    configuredBaseUrl.replace(
      /\/+$/,
      '',
    );

  return (
    `${baseUrl}` +
    `/forgot-password.html` +
    `?token=${encodeURIComponent(
      token,
    )}`
  );
}

  private toPublicUser(
    user: {
      id: string;
      email: string;
      fullName: string;
      avatarUrl: string | null;
      role: string;
      status: string;
      emailVerifiedAt?: Date | null;
      lastLoginAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    return {
      id: user.id,
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      avatar:
        user.avatarUrl ?? '',
      avatarUrl:
        user.avatarUrl,
      role: user.role,
      status: user.status,
      emailVerifiedAt:
        user.emailVerifiedAt ?? null,
      lastLoginAt:
        user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}