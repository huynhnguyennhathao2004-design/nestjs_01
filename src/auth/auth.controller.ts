import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { ChangePasswordDto } from './dto/change-password.dto';

import { ForgotPasswordDto } from './dto/forgot-password.dto';

import type {
  CookieOptions,
  Request,
  Response,
} from 'express';

import type {
  AuthenticatedUser,
} from './interfaces/authenticated-user.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  register(
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(
      registerDto,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const result =
      await this.authService.login(
        loginDto,
        this.getClientContext(request),
      );

    this.setRefreshCookie(
      response,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );

    const {
      refreshToken: _refreshToken,
      refreshTokenExpiresAt:
        _refreshTokenExpiresAt,
      ...publicResult
    } = result;

    return publicResult;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const currentRefreshToken =
      this.getRefreshToken(request);

    const result =
      await this.authService.refresh(
        currentRefreshToken,
        this.getClientContext(request),
      );

    this.setRefreshCookie(
      response,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );

    const {
      refreshToken: _refreshToken,
      refreshTokenExpiresAt:
        _refreshTokenExpiresAt,
      ...publicResult
    } = result;

    return publicResult;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const refreshToken =
      this.getRefreshTokenOptional(
        request,
      );

    const result =
      await this.authService.logout(
        refreshToken,
      );

    response.clearCookie(
      this.getCookieName(),
      this.getBaseCookieOptions(),
    );

    return result;
  }
@Patch('me/profile')
@HttpCode(HttpStatus.OK)
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
updateProfile(
  @CurrentUser()
  user: AuthenticatedUser,

  @Body()
  updateProfileDto: UpdateProfileDto,
) {
  return this.authService.updateProfile(
    user.id,
    updateProfileDto,
  );
}
@Patch('me/password')
@HttpCode(HttpStatus.OK)
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
async changePassword(
  @CurrentUser()
  user: AuthenticatedUser,

  @Body()
  changePasswordDto:
    ChangePasswordDto,

  @Res({ passthrough: true })
  response: Response,
) {
  const result =
    await this.authService.changePassword(
      user.id,
      changePasswordDto,
    );

  /*
   * Service đã thu hồi mọi refresh session.
   * Đồng thời xóa cookie trên trình duyệt.
   */
  response.clearCookie(
    this.getCookieName(),
    this.getBaseCookieOptions(),
  );

  return result;
}

@Post('forgot-password')
@HttpCode(HttpStatus.OK)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
requestPasswordReset(
  @Body()
  forgotPasswordDto:
    ForgotPasswordDto,
) {
  return this.authService
    .requestPasswordReset(
      forgotPasswordDto,
    );
}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return {
      success: true,
      user: {
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
          user.emailVerifiedAt,
        lastLoginAt:
          user.lastLoginAt,
        createdAt:
          user.createdAt,
        updatedAt:
          user.updatedAt,
      },
    };
  }

  private getRefreshToken(
    request: Request,
  ): string {
    const token =
      this.getRefreshTokenOptional(
        request,
      );

    if (!token) {
      return '';
    }

    return token;
  }

  private getRefreshTokenOptional(
    request: Request,
  ): string | undefined {
    const cookies =
      request.cookies as
        | Record<
            string,
            string | undefined
          >
        | undefined;

    return cookies?.[
      this.getCookieName()
    ];
  }

  private setRefreshCookie(
    response: Response,
    token: string,
    expiresAt: Date,
  ): void {
    response.cookie(
      this.getCookieName(),
      token,
      {
        ...this.getBaseCookieOptions(),
        expires: expiresAt,
      },
    );
  }

  private getBaseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure:
        this.configService
          .get<string>('NODE_ENV') ===
        'production',
      sameSite: 'lax',
      path: '/api/auth',
    };
  }

  private getCookieName(): string {
    return (
      this.configService.get<string>(
        'REFRESH_TOKEN_COOKIE_NAME',
      ) ||
      'travelTtsRefreshToken'
    );
  }

  private getClientContext(
    request: Request,
  ) {
    return {
      ipAddress: request.ip,
      userAgent:
        request.get('user-agent'),
    };
  }
}