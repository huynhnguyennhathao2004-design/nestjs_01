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

import {
  AdminDestinationsController,
} from './admin-destinations.controller';

import {
  AdminDestinationsService,
} from './admin-destinations.service';

import {
  StorageModule,
} from '../storage/storage.module';

@Module({
imports: [
  AuthModule,
  StorageModule,
],

  controllers: [
    AdminUsersController,
    AdminDestinationsController,
  ],

  providers: [
    AdminUsersService,
    AdminDestinationsService,
    AdminGuard,
  ],
})
export class AdminModule {}