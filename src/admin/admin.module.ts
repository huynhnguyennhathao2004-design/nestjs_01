import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  AdminUsersController,
} from './admin-users.controller';

import {
  AdminUsersService,
} from './admin-users.service';

import {
  AdminGuard,
} from './guards/admin.guard';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    AdminUsersController,
  ],

  providers: [
    AdminUsersService,
    AdminGuard,
  ],
})
export class AdminModule {}