import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';

import type {
  Request,
} from 'express';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  AdminUsersService,
} from './admin-users.service';

import {
  ListUsersQueryDto,
} from './dto/list-users-query.dto';

import {
  AdminGuard,
} from './guards/admin.guard';


import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator';

import type {
  AuthenticatedUser,
} from '../auth/interfaces/authenticated-user.interface';

import {
  UpdateUserStatusDto,
} from './dto/update-user-status.dto';


@Controller('admin/users')
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
)
export class AdminUsersController {
  constructor(
    private readonly adminUsersService:
      AdminUsersService,
  ) {}

  @Get()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  findAll(
    @Query()
    query: ListUsersQueryDto,
  ) {
    return this.adminUsersService
      .findAll(query);
  }

  @Patch(':id/status')
@HttpCode(HttpStatus.OK)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
updateStatus(
  @CurrentUser()
  currentAdmin:
    AuthenticatedUser,
  @Req()
  request:
    Request,

  @Param(
    'id',
    new ParseUUIDPipe({
      version: '4',
    }),
  )
  targetUserId: string,

  @Body()
  updateUserStatusDto:
    UpdateUserStatusDto,
) {
  const userAgentHeader =
    request.headers[
      'user-agent'
    ];

  const userAgent =
    typeof userAgentHeader ===
      'string'
      ? userAgentHeader
      : null;

  const ipAddress =
    request.ip ||
    request.socket
      .remoteAddress ||
    null;

  return this.adminUsersService
    .updateStatus(
      currentAdmin.id,
      targetUserId,
      updateUserStatusDto,
      {
        ipAddress,
        userAgent,
      },
    );

  }
}