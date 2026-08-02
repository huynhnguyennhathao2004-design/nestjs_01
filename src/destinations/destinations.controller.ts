import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { DestinationsService } from './destinations.service';

import { FindDestinationsQueryDto } from './dto/find-destinations-query.dto';

@Controller('destinations')
export class DestinationsController {
  constructor(
    private readonly destinationsService:
      DestinationsService,
  ) {}

  /**
   * GET /api/destinations
   */
  @Get()
  findAll(
    @Query()
    query: FindDestinationsQueryDto,
  ) {
    return this.destinationsService.findAll(
      query,
    );
  }

  /**
   * GET /api/destinations/da-lat
   */
  @Get(':slug')
  findOneBySlug(
    @Param('slug') slug: string,
  ) {
    return this.destinationsService.findOneBySlug(
      slug,
    );
  }
}