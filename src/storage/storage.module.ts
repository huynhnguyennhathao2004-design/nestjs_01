import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
} from '@nestjs/config';

import {
  DestinationImageStorageService,
} from './destination-image-storage.service';

import {
  DestinationImagesController,
} from './destination-images.controller';

@Module({
  imports: [
    ConfigModule,
  ],

  controllers: [
    DestinationImagesController,
  ],

  providers: [
    DestinationImageStorageService,
  ],

  exports: [
    DestinationImageStorageService,
  ],
})
export class StorageModule {}