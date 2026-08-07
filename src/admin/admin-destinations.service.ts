import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  randomUUID,
} from 'node:crypto';

import {
  DestinationImageStorageService,
} from '../storage/destination-image-storage.service';

import {
  UploadDestinationImageDto,
} from './dto/upload-destination-image.dto';

import {
  Prisma,
} from '../generated/prisma/client';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  UpdateDestinationDto,
} from './dto/update-destination.dto';

import {
  ListDestinationsQueryDto,
} from './dto/list-destinations-query.dto';

import {
  DestinationImageType,
  DestinationStatus,
} from '../generated/prisma/enums';

import {
  CreateDestinationDto,
} from './dto/create-destination.dto';


import {
  UpdateDestinationFeaturedDto,
} from './dto/update-destination-featured.dto';

import {
  UpdateDestinationStatusDto,
} from './dto/update-destination-status.dto';


import {
  CreateDestinationImageDto,
} from './dto/create-destination-image.dto';

import {
  UpdateDestinationImageDto,
} from './dto/update-destination-image.dto';

import {
  CreateDestinationFeatureDto,
} from './dto/create-destination-feature.dto';

import {
  UpdateDestinationFeatureDto,
} from './dto/update-destination-feature.dto';

import {
  CreateDestinationAttractionDto,
} from './dto/create-destination-attraction.dto';

import {
  UpdateDestinationAttractionDto,
} from './dto/update-destination-attraction.dto';

import {
  CreateDestinationFoodDto,
} from './dto/create-destination-food.dto';

import {
  UpdateDestinationFoodDto,
} from './dto/update-destination-food.dto';

interface AdminDestinationAuditRequestInfo {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface DestinationAuditSnapshotSource {
  id: string;
  provinceId: string;
  primaryCategoryId: string | null;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string;
  bestTravelTime: string | null;
  mapQuery: string | null;
  latitude: {
    toString(): string;
  } | null;
  longitude: {
    toString(): string;
  } | null;
  status: string;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  deletedAt?: Date | null;
  categories: Array<{
    categoryId: string;
  }>;
}
function hasVietnameseDiacritics(
  value: string,
): boolean {
  const valueWithoutDiacritics =
    value
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');

  return valueWithoutDiacritics !== value;
}

function normalizeSearchSlug(
  value: string,
): string {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      '-',
    )
    .replace(/^-+|-+$/g, '');
}
@Injectable()
export class AdminDestinationsService {
constructor(
  private readonly prisma:
    PrismaService,

  private readonly destinationImageStorageService:
    DestinationImageStorageService,
) {}

  private toSlug(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(/đ/g, 'd')
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      );
  }

private async createUniqueSlug(
  name: string,
  requestedSlug?: string,
): Promise<string> {
  const normalizedRequestedSlug =
    requestedSlug
      ? this.toSlug(requestedSlug)
      : '';

  /*
   * Nếu Admin chủ động nhập slug,
   * không tự đổi sang slug khác khi bị trùng.
   */
  if (requestedSlug) {
    if (!normalizedRequestedSlug) {
      throw new BadRequestException(
        'Slug địa điểm không hợp lệ.',
      );
    }

    const existingDestination =
      await this.prisma.destination
        .findUnique({
          where: {
            slug:
              normalizedRequestedSlug,
          },

          select: {
            id: true,
          },
        });

    if (existingDestination) {
      throw new ConflictException(
        `Slug "${normalizedRequestedSlug}" đã được sử dụng.`,
      );
    }

    return normalizedRequestedSlug;
  }

  /*
   * Nếu không nhập slug,
   * tự tạo từ tên địa điểm.
   */
  const baseSlug =
    this.toSlug(name)
      .slice(0, 180)
      .replace(/-+$/g, '');

  if (!baseSlug) {
    throw new BadRequestException(
      'Không thể tạo slug từ tên địa điểm.',
    );
  }

  let candidateSlug =
    baseSlug;

  let suffixNumber = 2;

  while (true) {
    const existingDestination =
      await this.prisma.destination
        .findUnique({
          where: {
            slug:
              candidateSlug,
          },

          select: {
            id: true,
          },
        });

    if (!existingDestination) {
      return candidateSlug;
    }

    const suffix =
      String(suffixNumber);

    const allowedBaseLength =
      180 -
      suffix.length -
      1;

    const shortenedBaseSlug =
      baseSlug
        .slice(
          0,
          allowedBaseLength,
        )
        .replace(/-+$/g, '');

    candidateSlug =
      `${shortenedBaseSlug}-${suffix}`;

    suffixNumber += 1;
  }
}

private async createUniqueSlugForUpdate(
  destinationId: string,
  requestedSlug: string,
): Promise<string> {
  const normalizedSlug =
    this.toSlug(requestedSlug);

  if (!normalizedSlug) {
    throw new BadRequestException(
      'Slug địa điểm không hợp lệ.',
    );
  }

  const duplicatedDestination =
    await this.prisma.destination.findFirst({
      where: {
        slug: normalizedSlug,

        NOT: {
          id: destinationId,
        },
      },

      select: {
        id: true,
      },
    });

  if (duplicatedDestination) {
    throw new ConflictException(
      `Slug "${normalizedSlug}" đã được sử dụng.`,
    );
  }

  return normalizedSlug;
}
private toAttractionAuditSnapshot(
  attraction: {
    id: string;
    destinationId: string;
    name: string;
    description: string | null;
    address: string | null;
    mapQuery: string | null;

    latitude: {
      toString(): string;
    } | null;

    longitude: {
      toString(): string;
    } | null;

    imageUrl: string | null;
    imageAlt: string | null;
    sourceUrl: string | null;
    imageCredit: string | null;
    sortOrder: number;
    isActive: boolean;
  },
): Prisma.InputJsonObject {
  return {
    id:
      attraction.id,

    destinationId:
      attraction.destinationId,

    name:
      attraction.name,

    description:
      attraction.description,

    address:
      attraction.address,

    mapQuery:
      attraction.mapQuery,

    latitude:
      attraction.latitude
        ?.toString() ??
      null,

    longitude:
      attraction.longitude
        ?.toString() ??
      null,

    imageUrl:
      attraction.imageUrl,

    imageAlt:
      attraction.imageAlt,

    sourceUrl:
      attraction.sourceUrl,

    imageCredit:
      attraction.imageCredit,

    sortOrder:
      attraction.sortOrder,

    isActive:
      attraction.isActive,
  };
}
private toFeatureAuditSnapshot(
  feature: {
    id: string;
    destinationId: string;
    title: string;
    content: string;
    icon: string | null;
    sortOrder: number;
  },
): Prisma.InputJsonObject {
  return {
    id: feature.id,

    destinationId:
      feature.destinationId,

    title:
      feature.title,

    content:
      feature.content,

    icon:
      feature.icon,

    sortOrder:
      feature.sortOrder,
  };
}
private toFoodAuditSnapshot(
  food: {
    id: string;
    destinationId: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    priceMin: number | null;
    priceMax: number | null;
    priceNote: string | null;
    suggestedArea: string | null;
    sourceUrl: string | null;
    imageCredit: string | null;
    sortOrder: number;
    isActive: boolean;
  },
): Prisma.InputJsonObject {
  return {
    id: food.id,

    destinationId:
      food.destinationId,

    name:
      food.name,

    description:
      food.description,

    imageUrl:
      food.imageUrl,

    imageAlt:
      food.imageAlt,

    priceMin:
      food.priceMin,

    priceMax:
      food.priceMax,

    priceNote:
      food.priceNote,

    suggestedArea:
      food.suggestedArea,

    sourceUrl:
      food.sourceUrl,

    imageCredit:
      food.imageCredit,

    sortOrder:
      food.sortOrder,

    isActive:
      food.isActive,
  };
}
private toImageAuditSnapshot(
  image: {
    id: string;
    destinationId: string;
    url: string;
    storageKey: string | null;
    altText: string | null;
    imageType: DestinationImageType;
    sourceUrl: string | null;
    imageCredit: string | null;
    sortOrder: number;
    isActive: boolean;
  },
): Prisma.InputJsonObject {
  return {
    id: image.id,
    destinationId:
      image.destinationId,

    url: image.url,

    storageKey:
      image.storageKey,

    altText:
      image.altText,

    imageType:
      image.imageType,

    sourceUrl:
      image.sourceUrl,

    imageCredit:
      image.imageCredit,

    sortOrder:
      image.sortOrder,

    isActive:
      image.isActive,
  };
}
private toAuditSnapshot(
  destination: DestinationAuditSnapshotSource,
): Prisma.InputJsonObject {
  return {
    id: destination.id,
    provinceId: destination.provinceId,

    primaryCategoryId:
      destination.primaryCategoryId,

    slug: destination.slug,
    name: destination.name,

    shortDescription:
      destination.shortDescription,

    description:
      destination.description,

    bestTravelTime:
      destination.bestTravelTime,

    mapQuery:
      destination.mapQuery,

    latitude:
      destination.latitude?.toString() ??
      null,

    longitude:
      destination.longitude?.toString() ??
      null,

    status:
      destination.status,

    isFeatured:
      destination.isFeatured,

    metaTitle:
      destination.metaTitle,

    metaDescription:
      destination.metaDescription,

    publishedAt:
      destination.publishedAt
        ?.toISOString() ??
      null,
    
    deletedAt:
      destination.deletedAt
        ?.toISOString() ??
      null,

    categoryIds:
      destination.categories
        .map((item) => item.categoryId)
        .sort(),
  };
}
async hardDeleteAll(
  currentAdminId: string,

  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  /*
   * Chỉ lấy các địa điểm đã được
   * chuyển vào thùng rác.
   */
  const destinations =
    await this.prisma.destination.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },

      orderBy: [
        {
          deletedAt: 'asc',
        },

        {
          id: 'asc',
        },
      ],

      select: {
        id: true,
        name: true,
      },
    });

  if (destinations.length === 0) {
    return {
      success: true,

      message:
        'Thùng rác địa điểm đang trống.',

      data: {
        total: 0,
        deletedCount: 0,
        failedCount: 0,
        failedIds: [],
      },
    };
  }

  let deletedCount = 0;

  const failedIds:
    string[] = [];

  /*
   * Gọi lại hardDelete của từng địa điểm.
   *
   * Nhờ vậy toàn bộ xử lý hiện có như:
   * - xóa ảnh trên R2;
   * - xóa dữ liệu liên quan;
   * - ghi audit log;
   * vẫn được giữ nguyên.
   */
  for (
    const destination of destinations
  ) {
    try {
      await this.hardDelete(
        currentAdminId,
        destination.id,
        requestInfo,
      );

      deletedCount += 1;
    } catch (error: unknown) {
      failedIds.push(
        destination.id,
      );

      console.error(
        '[AdminDestinationsService] Không thể xóa địa điểm trong thao tác xóa tất cả:',
        {
          destinationId:
            destination.id,

          destinationName:
            destination.name,

          error:
            error instanceof Error
              ? error.message
              : 'UnknownError',
        },
      );
    }
  }

  const failedCount =
    failedIds.length;

  return {
    success:
      failedCount === 0,

    message:
      failedCount === 0
        ? `Đã xóa vĩnh viễn ${deletedCount} địa điểm.`
        : (
            `Đã xóa ${deletedCount}/${destinations.length} địa điểm. ` +
            `${failedCount} địa điểm chưa xóa được.`
          ),

    data: {
      total:
        destinations.length,

      deletedCount,

      failedCount,

      failedIds,
    },
  };
}
async hardDelete(
  currentAdminId: string,
  destinationId: string,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const existingDestination =
    await this.prisma.destination
      .findUnique({
        where: {
          id:
            destinationId,
        },

        select: {
          id: true,
          provinceId: true,
          primaryCategoryId: true,
          slug: true,
          name: true,
          shortDescription: true,
          description: true,
          bestTravelTime: true,
          mapQuery: true,
          latitude: true,
          longitude: true,
          status: true,
          isFeatured: true,
          metaTitle: true,
          metaDescription: true,
          publishedAt: true,
          deletedAt: true,

          categories: {
            select: {
              categoryId: true,
            },
          },
          images: {
            where: {
              storageKey: {
                not:
                  null,
              },
            },

            select: {
              id:
                true,

              storageKey:
                true,
            },
          },

          foods: {
            select: {
              id:
                true,

              imageUrl:
                true,
            },
          },
        },
      });

  if (!existingDestination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  /*
   * Không cho xóa vĩnh viễn trực tiếp
   * một địa điểm đang hoạt động.
   */
  if (
    !existingDestination.deletedAt
  ) {
    throw new BadRequestException(
      'Bạn phải chuyển địa điểm vào thùng rác trước khi xóa vĩnh viễn.',
    );
  }
  /*
 * Thu thập các object thuộc hệ thống R2 mới.
 * Ảnh local cũ hoặc URL ngoài không có
 * storageKey sẽ được database cascade xóa.
 */
const destinationImageStorageKeys =
  Array.from(
    new Set(
      existingDestination.images
        .map(
          (image) =>
            image.storageKey
              ?.trim() ||
            '',
        )
        .filter(
          (storageKey) =>
            storageKey.startsWith(
              'destinations/',
            ),
        ),
    ),
  );

const destinationFoodStorageKeys =
  existingDestination.foods
    .filter(
      (food) =>
        food.imageUrl
          ?.startsWith(
            `/api/destination-images/foods/${food.id}/content`,
          ),
    )
    .map(
      (food) =>
        [
          'destinations',
          existingDestination.id,
          'foods',
          `${food.id}.webp`,
        ].join('/'),
    );

const allDestinationStorageKeys =
  Array.from(
    new Set([
      ...destinationImageStorageKeys,
      ...destinationFoodStorageKeys,
    ]),
  );

/*
 * Xóa file R2 trước khi xóa cứng database.
 *
 * deleteImageObject là idempotent:
 * object đã mất vẫn được xem là xóa thành công.
 * Vì vậy có thể thử lại nếu thao tác bị gián đoạn.
 */
for (
  const storageKey of
  allDestinationStorageKeys
) {
  await this
    .destinationImageStorageService
    .deleteImageObject(
      storageKey,
    );
}

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  await this.prisma.$transaction(
    async (transaction) => {
      /*
       * Ghi audit trước khi xóa.
       * AuditLog không phụ thuộc khóa ngoại
       * trực tiếp vào Destination.
       */
      await transaction.auditLog.create({
        data: {
          actorUserId:
            currentAdminId,

          action:
            'HARD_DELETE_DESTINATION',

          entityType:
            'DESTINATION',

          entityId:
            existingDestination.id,

          oldData:
            this.toAuditSnapshot(
              existingDestination,
            ),

          newData:
            Prisma.DbNull,

          ipAddress:
            auditIpAddress,

          userAgent:
            auditUserAgent,
        },
      });

      await transaction.destination.delete({
        where: {
          id:
            existingDestination.id,
        },
      });
    },
  );

  return {
    success: true,

    message:
      'Đã xóa vĩnh viễn địa điểm.',

    data: {
      id:
        existingDestination.id,

      name:
        existingDestination.name,

      slug:
        existingDestination.slug,

      deletedImageObjectCount:
        destinationImageStorageKeys.length,

      deletedFoodImageObjectCount:
        destinationFoodStorageKeys.length,

      deletedStorageObjectCount:
        allDestinationStorageKeys.length,
    },
  };
}
  async findAll(
    query: ListDestinationsQueryDto,
  ) {
    const page =
      query.page || 1;

    const limit =
      query.limit || 20;

    const skip =
      (page - 1) * limit;

    const conditions:
      Prisma.DestinationWhereInput[] = [];

    if (query.search) {
  const searchText =
    query.search.trim();

  const searchConditions:
    Prisma.DestinationWhereInput[] = [
      {
        name: {
          contains:
            searchText,

          mode:
            'insensitive',
        },
      },

      {
        shortDescription: {
          contains:
            searchText,

          mode:
            'insensitive',
        },
      },

      {
        province: {
          name: {
            contains:
              searchText,

            mode:
              'insensitive',
          },
        },
      },

      {
        province: {
          region: {
            name: {
              contains:
                searchText,

              mode:
                'insensitive',
            },
          },
        },
      },

      {
        categories: {
          some: {
            category: {
              name: {
                contains:
                  searchText,

                mode:
                  'insensitive',
              },
            },
          },
        },
      },
    ];

  /*
   * Chỉ tìm theo slug khi người dùng nhập
   * từ khóa không dấu.
   *
   * Ví dụ:
   * - "da lat" được tìm qua slug "da-lat".
   * - "đà" không bị đổi thành "da".
   */
  if (
    !hasVietnameseDiacritics(
      searchText,
    )
  ) {
    const slugSearch =
      normalizeSearchSlug(
        searchText,
      );

    if (slugSearch) {
      searchConditions.push({
        slug: {
          contains:
            slugSearch,

          mode:
            'insensitive',
        },
      });
    }
  }

  conditions.push({
    OR:
      searchConditions,
  });
}

    if (query.status) {
      conditions.push({
        status: query.status,
      });
    }

    if (query.region) {
      const regionSlug =
        this.toSlug(
          query.region,
        );

      conditions.push({
        province: {
          is: {
            region: {
              is: {
                OR: [
                  {
                    name: {
                      equals:
                        query.region,
                      mode:
                        'insensitive',
                    },
                  },

                  {
                    slug: {
                      equals:
                        regionSlug,
                      mode:
                        'insensitive',
                    },
                  },
                ],
              },
            },
          },
        },
      });
    }

    if (query.category) {
      const categorySlug =
        this.toSlug(
          query.category,
        );

      conditions.push({
        OR: [
          {
            primaryCategory: {
              is: {
                OR: [
                  {
                    name: {
                      equals:
                        query.category,
                      mode:
                        'insensitive',
                    },
                  },

                  {
                    slug: {
                      equals:
                        categorySlug,
                      mode:
                        'insensitive',
                    },
                  },
                ],
              },
            },
          },

          {
            categories: {
              some: {
                category: {
                  is: {
                    OR: [
                      {
                        name: {
                          equals:
                            query.category,
                          mode:
                            'insensitive',
                        },
                      },

                      {
                        slug: {
                          equals:
                            categorySlug,
                          mode:
                            'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      });
    }

    const deletedFilter =
      query.deleted ?? 'ACTIVE';

    const where:
      Prisma.DestinationWhereInput = {
        /*
         * Mặc định chỉ lấy dữ liệu chưa xóa.
         */
        ...(deletedFilter === 'ACTIVE'
          ? {
              deletedAt: null,
            }
          : {}),

        /*
         * Chỉ lấy dữ liệu trong thùng rác.
         */
        ...(deletedFilter === 'DELETED'
          ? {
              deletedAt: {
                not: null,
              },
            }
          : {}),

        /*
         * Với ALL, không thêm điều kiện deletedAt.
         */
        ...(conditions.length > 0
          ? {
              AND: conditions,
            }
          : {}),
      };

    const [
      destinations,
      total,
    ] =
      await this.prisma.$transaction([
        this.prisma.destination
          .findMany({
            where,
            skip,
            take: limit,

            orderBy: [
              {
                updatedAt: 'desc',
              },
              {
                name: 'asc',
              },
            ],

            select: {
              id: true,
              slug: true,
              name: true,
              shortDescription:
                true,

              status: true,
              isFeatured: true,
              publishedAt: true,

              createdAt: true,
              updatedAt: true,
              deletedAt: true,

              province: {
                select: {
                  id: true,
                  name: true,
                  slug: true,

                  region: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },

              primaryCategory: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },

              categories: {
                select: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },

              images: {
                where: {
                  isActive: true,
                },

              orderBy: [
                {
                  imageType: 'asc',
                },
                {
                  sortOrder: 'asc',
                },
              ],

                take: 1,

                select: {
                  id: true,
                  url: true,
                  altText: true,
                  imageType: true,
                },
              },

              _count: {
                select: {
                  categories: true,
                  images: true,
                  features: true,
                  attractions: true,
                  foods: true,
                  contentBlocks:
                    true,
                },
              },
            },
          }),

        this.prisma.destination
          .count({
            where,
          }),
      ]);

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / limit,
        ),
      );

    return {
      success: true,

      data: destinations.map(
        (destination) => ({
          id: destination.id,
          slug: destination.slug,
          name: destination.name,

          shortDescription:
            destination
              .shortDescription,

          status:
            destination.status,

          isFeatured:
            destination
              .isFeatured,

          publishedAt:
            destination
              .publishedAt,

          createdAt:
            destination.createdAt,

          updatedAt:
            destination.updatedAt,
deletedAt:
  destination.deletedAt,

          province:
            destination.province,

          region:
            destination
              .province
              .region,

          primaryCategory:
            destination
              .primaryCategory,

          categories:
            destination.categories
              .map(
                (item) =>
                  item.category,
              )
              .sort(
                (
                  firstCategory,
                  secondCategory,
                ) =>
                  firstCategory
                    .name
                    .localeCompare(
                      secondCategory
                        .name,
                      'vi',
                    ),
              ),

          coverImage:
            destination.images[0] ??
            null,

          counts: {
            categories:
              destination
                ._count
                .categories,

            images:
              destination
                ._count
                .images,

            features:
              destination
                ._count
                .features,

            attractions:
              destination
                ._count
                .attractions,

            foods:
              destination
                ._count
                .foods,

            contentBlocks:
              destination
                ._count
                .contentBlocks,
          },
        }),
      ),

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasPreviousPage:
          page > 1,

        hasNextPage:
          page < totalPages,
      },
    };
  }

async create(
  currentAdminId: string,
  dto: CreateDestinationDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const slug =
    await this.createUniqueSlug(
      dto.name,
      dto.slug,
    );

  /*
   * Danh mục chính luôn được đưa vào
   * bảng destination_categories.
   */
  const categoryIds = [
    ...new Set([
      dto.primaryCategoryId,
      ...(dto.categoryIds ?? []),
    ]),
  ];

  const [
    province,
    categories,
  ] = await Promise.all([
    this.prisma.province.findUnique({
      where: {
        id: dto.provinceId,
      },

      select: {
        id: true,
        name: true,
        slug: true,

        region: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),

    this.prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },

        isActive: true,
      },

      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  if (!province) {
    throw new BadRequestException(
      'Tỉnh/thành được chọn không tồn tại.',
    );
  }

  if (
    categories.length !==
    categoryIds.length
  ) {
    const foundCategoryIds =
      new Set(
        categories.map(
          (category) =>
            category.id,
        ),
      );

    const invalidCategoryIds =
      categoryIds.filter(
        (categoryId) =>
          !foundCategoryIds.has(
            categoryId,
          ),
      );

    throw new BadRequestException(
      'Một hoặc nhiều danh mục không tồn tại hoặc đã bị vô hiệu hóa: ' +
        invalidCategoryIds.join(', '),
    );
  }

  const primaryCategory =
    categories.find(
      (category) =>
        category.id ===
        dto.primaryCategoryId,
    );

  if (!primaryCategory) {
    throw new BadRequestException(
      'Danh mục chính không tồn tại hoặc đã bị vô hiệu hóa.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const createdDestination =
    await this.prisma.$transaction(
      async (transaction) => {
        /*
         * Địa điểm mới luôn là bản nháp.
         * Việc xuất bản được làm ở 5.7.4.
         */
        const destination =
          await transaction
            .destination
            .create({
              data: {
                provinceId:
                  province.id,

                primaryCategoryId:
                  primaryCategory.id,

                slug,
                name:
                  dto.name,

                shortDescription:
                  dto.shortDescription ??
                  null,

                description:
                  dto.description,

                bestTravelTime:
                  dto.bestTravelTime ??
                  null,

                mapQuery:
                  dto.mapQuery ??
                  null,

                latitude:
                  dto.latitude ??
                  null,

                longitude:
                  dto.longitude ??
                  null,

                status:
                  DestinationStatus.DRAFT,

                isFeatured:
                  false,

                metaTitle:
                  dto.metaTitle ??
                  dto.name,

                metaDescription:
                  dto.metaDescription ??
                  dto.shortDescription ??
                  null,

                createdById:
                  currentAdminId,

                updatedById:
                  currentAdminId,

                publishedAt:
                  null,
              },

              select: {
                id: true,
                slug: true,
                name: true,
                status: true,
                createdAt: true,
              },
            });

        await transaction
          .destinationCategory
          .createMany({
            data:
              categoryIds.map(
                (categoryId) => ({
                  destinationId:
                    destination.id,

                  categoryId,
                }),
              ),
          });

        await transaction
          .auditLog
          .create({
            data: {
              actorUserId:
                currentAdminId,

              action:
                'CREATE_DESTINATION',

              entityType:
                'DESTINATION',

              entityId:
                destination.id,

              oldData:
                Prisma.DbNull,

              newData: {
                id:
                  destination.id,

                slug:
                  destination.slug,

                name:
                  destination.name,

                provinceId:
                  province.id,

                provinceName:
                  province.name,

                regionId:
                  province.region.id,

                regionName:
                  province.region.name,

                primaryCategoryId:
                  primaryCategory.id,

                primaryCategoryName:
                  primaryCategory.name,

                categoryIds,

                status:
                  destination.status,

                shortDescription:
                  dto.shortDescription ??
                  null,

                description:
                  dto.description,

                bestTravelTime:
                  dto.bestTravelTime ??
                  null,

                mapQuery:
                  dto.mapQuery ??
                  null,

                latitude:
                  dto.latitude ??
                  null,

                longitude:
                  dto.longitude ??
                  null,
              },

              ipAddress:
                auditIpAddress,

              userAgent:
                auditUserAgent,
            },
          });

        return destination;
      },
    );

  /*
   * Dùng lại hàm findOne để trả về
   * toàn bộ dữ liệu địa điểm vừa tạo.
   */
  const createdDetail =
    await this.findOne(
      createdDestination.id,
    );

  return {
    success: true,

    message:
      'Tạo địa điểm thành công. Địa điểm hiện đang ở trạng thái bản nháp.',

    data:
      createdDetail.data,
  };
}

async update(
  currentAdminId: string,
  destinationId: string,
  dto: UpdateDestinationDto,
  requestInfo: AdminDestinationAuditRequestInfo,
) {
  const hasSubmittedField =
    Object.values(dto).some(
      (value) => value !== undefined,
    );

  if (!hasSubmittedField) {
    throw new BadRequestException(
      'Bạn chưa gửi thông tin nào cần cập nhật.',
    );
  }

  const existingDestination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
        provinceId: true,
        primaryCategoryId: true,
        slug: true,
        name: true,
        shortDescription: true,
        description: true,
        bestTravelTime: true,
        mapQuery: true,
        latitude: true,
        longitude: true,
        status: true,
        isFeatured: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,

        categories: {
          select: {
            categoryId: true,
          },
        },
      },
    });

  if (!existingDestination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  let normalizedSlug =
    existingDestination.slug;

  if (dto.slug !== undefined) {
    normalizedSlug =
      await this.createUniqueSlugForUpdate(
        destinationId,
        dto.slug,
      );
  }

  /*
   * Chỉ kiểm tra tỉnh mới nếu Admin gửi provinceId.
   */
  if (dto.provinceId !== undefined) {
    const provinceExists =
      await this.prisma.province.findUnique({
        where: {
          id: dto.provinceId,
        },

        select: {
          id: true,
        },
      });

    if (!provinceExists) {
      throw new BadRequestException(
        'Tỉnh/thành được chọn không tồn tại.',
      );
    }
  }

  const shouldReplaceCategories =
    dto.categoryIds !== undefined ||
    dto.primaryCategoryId !== undefined;

  const nextPrimaryCategoryId =
    dto.primaryCategoryId ??
    existingDestination.primaryCategoryId;

  let nextCategoryIds =
    existingDestination.categories.map(
      (item) => item.categoryId,
    );

  if (shouldReplaceCategories) {
    /*
     * Nếu categoryIds không được gửi,
     * giữ các danh mục cũ.
     */
    const submittedCategoryIds =
      dto.categoryIds !== undefined
        ? dto.categoryIds
        : nextCategoryIds;

    nextCategoryIds = [
      ...new Set([
        ...submittedCategoryIds,

        ...(nextPrimaryCategoryId
          ? [nextPrimaryCategoryId]
          : []),
      ]),
    ];

    const categoryRecords =
      await this.prisma.category.findMany({
        where: {
          id: {
            in: nextCategoryIds,
          },
        },

        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

    const foundCategoryIds =
      new Set(
        categoryRecords.map(
          (category) => category.id,
        ),
      );

    const missingCategoryIds =
      nextCategoryIds.filter(
        (categoryId) =>
          !foundCategoryIds.has(
            categoryId,
          ),
      );

    if (missingCategoryIds.length > 0) {
      throw new BadRequestException(
        'Một hoặc nhiều danh mục không tồn tại: ' +
          missingCategoryIds.join(', '),
      );
    }

    /*
     * Danh mục Admin vừa chọn và danh mục chính
     * phải đang hoạt động.
     */
    const requiredActiveCategoryIds =
      new Set([
        ...(dto.categoryIds ?? []),

        ...(nextPrimaryCategoryId
          ? [nextPrimaryCategoryId]
          : []),
      ]);

    const inactiveCategories =
      categoryRecords.filter(
        (category) =>
          requiredActiveCategoryIds.has(
            category.id,
          ) &&
          !category.isActive,
      );

    if (inactiveCategories.length > 0) {
      throw new BadRequestException(
        'Các danh mục sau đã bị vô hiệu hóa: ' +
          inactiveCategories
            .map((category) => category.name)
            .join(', '),
      );
    }
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const updateData = {
    updatedById: currentAdminId,

    ...(dto.name !== undefined
      ? {
          name: dto.name,
        }
      : {}),

    ...(dto.slug !== undefined
      ? {
          slug: normalizedSlug,
        }
      : {}),

    ...(dto.provinceId !== undefined
      ? {
          provinceId: dto.provinceId,
        }
      : {}),

    ...(dto.primaryCategoryId !== undefined
      ? {
          primaryCategoryId:
            dto.primaryCategoryId,
        }
      : {}),

    ...(dto.shortDescription !== undefined
      ? {
          shortDescription:
            dto.shortDescription,
        }
      : {}),

    ...(dto.description !== undefined
      ? {
          description:
            dto.description,
        }
      : {}),

    ...(dto.bestTravelTime !== undefined
      ? {
          bestTravelTime:
            dto.bestTravelTime,
        }
      : {}),

    ...(dto.mapQuery !== undefined
      ? {
          mapQuery:
            dto.mapQuery,
        }
      : {}),

    ...(dto.latitude !== undefined
      ? {
          latitude:
            dto.latitude,
        }
      : {}),

    ...(dto.longitude !== undefined
      ? {
          longitude:
            dto.longitude,
        }
      : {}),

    ...(dto.metaTitle !== undefined
      ? {
          metaTitle:
            dto.metaTitle,
        }
      : {}),

    ...(dto.metaDescription !== undefined
      ? {
          metaDescription:
            dto.metaDescription,
        }
      : {}),
  };

  await this.prisma.$transaction(
    async (transaction) => {
      await transaction.destination.update({
        where: {
          id: existingDestination.id,
        },

        data: updateData,
      });

      if (shouldReplaceCategories) {
        await transaction
          .destinationCategory
          .deleteMany({
            where: {
              destinationId:
                existingDestination.id,
            },
          });

        if (nextCategoryIds.length > 0) {
          await transaction
            .destinationCategory
            .createMany({
              data: nextCategoryIds.map(
                (categoryId) => ({
                  destinationId:
                    existingDestination.id,

                  categoryId,
                }),
              ),
            });
        }
      }

      const updatedDestination =
        await transaction.destination
          .findUniqueOrThrow({
            where: {
              id: existingDestination.id,
            },

            select: {
              id: true,
              provinceId: true,
              primaryCategoryId: true,
              slug: true,
              name: true,
              shortDescription: true,
              description: true,
              bestTravelTime: true,
              mapQuery: true,
              latitude: true,
              longitude: true,
              status: true,
              isFeatured: true,
              metaTitle: true,
              metaDescription: true,
              publishedAt: true,

              categories: {
                select: {
                  categoryId: true,
                },
              },
            },
          });

      await transaction.auditLog.create({
        data: {
          actorUserId:
            currentAdminId,

          action:
            'UPDATE_DESTINATION',

          entityType:
            'DESTINATION',

          entityId:
            existingDestination.id,

          oldData:
            this.toAuditSnapshot(
              existingDestination,
            ),

          newData:
            this.toAuditSnapshot(
              updatedDestination,
            ),

          ipAddress:
            auditIpAddress,

          userAgent:
            auditUserAgent,
        },
      });
    },
  );

  const updatedDetail =
    await this.findOne(
      existingDestination.id,
    );

  return {
    success: true,

    message:
      'Cập nhật địa điểm thành công.',

    data:
      updatedDetail.data,
  };
}

async updateStatus(
  currentAdminId: string,
  destinationId: string,
  dto: UpdateDestinationStatusDto,
  requestInfo: AdminDestinationAuditRequestInfo,
) {
  const existingDestination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
        provinceId: true,
        primaryCategoryId: true,
        slug: true,
        name: true,
        shortDescription: true,
        description: true,
        bestTravelTime: true,
        mapQuery: true,
        latitude: true,
        longitude: true,
        status: true,
        isFeatured: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,

        categories: {
          select: {
            categoryId: true,
          },
        },
      },
    });

  if (!existingDestination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  /*
   * Nếu trạng thái không thay đổi thì không tạo audit log mới.
   */
  if (
    existingDestination.status ===
    dto.status
  ) {
    const unchangedDetail =
      await this.findOne(
        existingDestination.id,
      );

    return {
      success: true,

      message:
        `Địa điểm đã ở trạng thái ${dto.status}.`,

      data:
        unchangedDetail.data,
    };
  }

  /*
   * Kiểm tra dữ liệu tối thiểu trước khi xuất bản.
   */
  if (
    dto.status ===
    DestinationStatus.PUBLISHED
  ) {
    if (
      !existingDestination.name.trim()
    ) {
      throw new BadRequestException(
        'Không thể xuất bản địa điểm chưa có tên.',
      );
    }

    if (
      !existingDestination
        .description
        .trim()
    ) {
      throw new BadRequestException(
        'Không thể xuất bản địa điểm chưa có nội dung giới thiệu.',
      );
    }

    if (
      !existingDestination
        .primaryCategoryId
    ) {
      throw new BadRequestException(
        'Không thể xuất bản địa điểm chưa có danh mục chính.',
      );
    }

    if (
      existingDestination
        .categories
        .length === 0
    ) {
      throw new BadRequestException(
        'Không thể xuất bản địa điểm chưa có danh mục liên kết.',
      );
    }
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  let auditAction:
    string;

  switch (dto.status) {
    case DestinationStatus.PUBLISHED:
      auditAction =
        'PUBLISH_DESTINATION';
      break;

    case DestinationStatus.HIDDEN:
      auditAction =
        'HIDE_DESTINATION';
      break;

    case DestinationStatus.ARCHIVED:
      auditAction =
        'ARCHIVE_DESTINATION';
      break;

    case DestinationStatus.DRAFT:
    default:
      auditAction =
        'SET_DESTINATION_DRAFT';
      break;
  }

  await this.prisma.$transaction(
    async (transaction) => {
      await transaction.destination.update({
        where: {
          id: existingDestination.id,
        },

        data: {
          status:
            dto.status,

          updatedById:
            currentAdminId,

          /*
           * Lần xuất bản đầu tiên sẽ ghi ngày xuất bản.
           * Khi xuất bản lại, giữ ngày xuất bản cũ.
           */
          ...(dto.status ===
          DestinationStatus.PUBLISHED
            ? {
                publishedAt:
                  existingDestination
                    .publishedAt ??
                  new Date(),
              }
            : {}),

          /*
           * Chuyển về DRAFT thì xóa thời điểm xuất bản.
           */
          ...(dto.status ===
          DestinationStatus.DRAFT
            ? {
                publishedAt:
                  null,
              }
            : {}),

          /*
           * Địa điểm không công khai không được nổi bật.
           */
          ...(dto.status !==
          DestinationStatus.PUBLISHED
            ? {
                isFeatured:
                  false,
              }
            : {}),
        },
      });

      const updatedDestination =
        await transaction.destination
          .findUniqueOrThrow({
            where: {
              id:
                existingDestination.id,
            },

            select: {
              id: true,
              provinceId: true,
              primaryCategoryId: true,
              slug: true,
              name: true,
              shortDescription: true,
              description: true,
              bestTravelTime: true,
              mapQuery: true,
              latitude: true,
              longitude: true,
              status: true,
              isFeatured: true,
              metaTitle: true,
              metaDescription: true,
              publishedAt: true,

              categories: {
                select: {
                  categoryId: true,
                },
              },
            },
          });

      await transaction.auditLog.create({
        data: {
          actorUserId:
            currentAdminId,

          action:
            auditAction,

          entityType:
            'DESTINATION',

          entityId:
            existingDestination.id,

          oldData:
            this.toAuditSnapshot(
              existingDestination,
            ),

          newData:
            this.toAuditSnapshot(
              updatedDestination,
            ),

          ipAddress:
            auditIpAddress,

          userAgent:
            auditUserAgent,
        },
      });
    },
  );

  const updatedDetail =
    await this.findOne(
      existingDestination.id,
    );

  const statusMessages:
    Record<
      DestinationStatus,
      string
    > = {
    [DestinationStatus.DRAFT]:
      'Đã chuyển địa điểm về bản nháp.',

    [DestinationStatus.PUBLISHED]:
      'Xuất bản địa điểm thành công.',

    [DestinationStatus.HIDDEN]:
      'Đã ẩn địa điểm khỏi website.',

    [DestinationStatus.ARCHIVED]:
      'Đã lưu trữ địa điểm.',
  };

  return {
    success: true,

    message:
      statusMessages[dto.status],

    data:
      updatedDetail.data,
  };
}

async updateFeatured(
  currentAdminId: string,
  destinationId: string,
  dto: UpdateDestinationFeaturedDto,
  requestInfo: AdminDestinationAuditRequestInfo,
) {
  const existingDestination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
        provinceId: true,
        primaryCategoryId: true,
        slug: true,
        name: true,
        shortDescription: true,
        description: true,
        bestTravelTime: true,
        mapQuery: true,
        latitude: true,
        longitude: true,
        status: true,
        isFeatured: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,

        categories: {
          select: {
            categoryId: true,
          },
        },
      },
    });

  if (!existingDestination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  /*
   * Chỉ địa điểm đang xuất bản mới được nổi bật.
   */
  if (
    dto.isFeatured &&
    existingDestination.status !==
      DestinationStatus.PUBLISHED
  ) {
    throw new BadRequestException(
      'Chỉ địa điểm đã xuất bản mới có thể được đánh dấu nổi bật.',
    );
  }

  if (
    existingDestination.isFeatured ===
    dto.isFeatured
  ) {
    const unchangedDetail =
      await this.findOne(
        existingDestination.id,
      );

    return {
      success: true,

      message:
        dto.isFeatured
          ? 'Địa điểm đã được đánh dấu nổi bật.'
          : 'Địa điểm hiện không được đánh dấu nổi bật.',

      data:
        unchangedDetail.data,
    };
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  await this.prisma.$transaction(
    async (transaction) => {
      await transaction.destination.update({
        where: {
          id:
            existingDestination.id,
        },

        data: {
          isFeatured:
            dto.isFeatured,

          updatedById:
            currentAdminId,
        },
      });

      const updatedDestination =
        await transaction.destination
          .findUniqueOrThrow({
            where: {
              id:
                existingDestination.id,
            },

            select: {
              id: true,
              provinceId: true,
              primaryCategoryId: true,
              slug: true,
              name: true,
              shortDescription: true,
              description: true,
              bestTravelTime: true,
              mapQuery: true,
              latitude: true,
              longitude: true,
              status: true,
              isFeatured: true,
              metaTitle: true,
              metaDescription: true,
              publishedAt: true,

              categories: {
                select: {
                  categoryId: true,
                },
              },
            },
          });

      await transaction.auditLog.create({
        data: {
          actorUserId:
            currentAdminId,

          action:
            dto.isFeatured
              ? 'FEATURE_DESTINATION'
              : 'UNFEATURE_DESTINATION',

          entityType:
            'DESTINATION',

          entityId:
            existingDestination.id,

          oldData:
            this.toAuditSnapshot(
              existingDestination,
            ),

          newData:
            this.toAuditSnapshot(
              updatedDestination,
            ),

          ipAddress:
            auditIpAddress,

          userAgent:
            auditUserAgent,
        },
      });
    },
  );

  const updatedDetail =
    await this.findOne(
      existingDestination.id,
    );

  return {
    success: true,

    message:
      dto.isFeatured
        ? 'Đã đánh dấu địa điểm nổi bật.'
        : 'Đã bỏ đánh dấu địa điểm nổi bật.',

    data:
      updatedDetail.data,
  };
}
async softDelete(
  currentAdminId: string,
  destinationId: string,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const existingDestination =
    await this.prisma.destination
      .findUnique({
        where: {
          id: destinationId,
        },

        select: {
          id: true,
          provinceId: true,
          primaryCategoryId: true,
          slug: true,
          name: true,
          shortDescription: true,
          description: true,
          bestTravelTime: true,
          mapQuery: true,
          latitude: true,
          longitude: true,
          status: true,
          isFeatured: true,
          metaTitle: true,
          metaDescription: true,
          publishedAt: true,
          deletedAt: true,

          categories: {
            select: {
              categoryId: true,
            },
          },
        },
      });

  if (!existingDestination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  /*
   * Xử lý lặp an toàn:
   * gọi xóa lần nữa không tạo audit log mới.
   */
  if (existingDestination.deletedAt) {
    const deletedDetail =
      await this.findOne(
        existingDestination.id,
      );

    return {
      success: true,

      message:
        'Địa điểm đã nằm trong thùng rác.',

      data:
        deletedDetail.data,
    };
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  await this.prisma.$transaction(
    async (transaction) => {
      await transaction.destination.update({
        where: {
          id:
            existingDestination.id,
        },

        data: {
          deletedAt:
            new Date(),

          status:
            DestinationStatus.ARCHIVED,

          isFeatured:
            false,

          updatedById:
            currentAdminId,
        },
      });

      const deletedDestination =
        await transaction.destination
          .findUniqueOrThrow({
            where: {
              id:
                existingDestination.id,
            },

            select: {
              id: true,
              provinceId: true,
              primaryCategoryId: true,
              slug: true,
              name: true,
              shortDescription: true,
              description: true,
              bestTravelTime: true,
              mapQuery: true,
              latitude: true,
              longitude: true,
              status: true,
              isFeatured: true,
              metaTitle: true,
              metaDescription: true,
              publishedAt: true,
              deletedAt: true,

              categories: {
                select: {
                  categoryId: true,
                },
              },
            },
          });

      await transaction.auditLog.create({
        data: {
          actorUserId:
            currentAdminId,

          action:
            'SOFT_DELETE_DESTINATION',

          entityType:
            'DESTINATION',

          entityId:
            existingDestination.id,

          oldData:
            this.toAuditSnapshot(
              existingDestination,
            ),

          newData:
            this.toAuditSnapshot(
              deletedDestination,
            ),

          ipAddress:
            auditIpAddress,

          userAgent:
            auditUserAgent,
        },
      });
    },
  );

  const deletedDetail =
    await this.findOne(
      existingDestination.id,
    );

  return {
    success: true,

    message:
      'Đã chuyển địa điểm vào thùng rác.',

    data:
      deletedDetail.data,
  };
}

async restore(
  currentAdminId: string,
  destinationId: string,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const existingDestination =
    await this.prisma.destination
      .findUnique({
        where: {
          id: destinationId,
        },

        select: {
          id: true,
          provinceId: true,
          primaryCategoryId: true,
          slug: true,
          name: true,
          shortDescription: true,
          description: true,
          bestTravelTime: true,
          mapQuery: true,
          latitude: true,
          longitude: true,
          status: true,
          isFeatured: true,
          metaTitle: true,
          metaDescription: true,
          publishedAt: true,
          deletedAt: true,

          categories: {
            select: {
              categoryId: true,
            },
          },
        },
      });

  if (!existingDestination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  /*
   * Gọi khôi phục địa điểm đang hoạt động
   * sẽ không tạo audit log mới.
   */
  if (!existingDestination.deletedAt) {
    const activeDetail =
      await this.findOne(
        existingDestination.id,
      );

    return {
      success: true,

      message:
        'Địa điểm hiện không nằm trong thùng rác.',

      data:
        activeDetail.data,
    };
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  await this.prisma.$transaction(
    async (transaction) => {
      await transaction.destination.update({
        where: {
          id:
            existingDestination.id,
        },

        data: {
          deletedAt:
            null,

          /*
           * Khôi phục về bản nháp để Admin
           * kiểm tra trước khi xuất bản lại.
           */
          status:
            DestinationStatus.DRAFT,

          isFeatured:
            false,

          publishedAt:
            null,

          updatedById:
            currentAdminId,
        },
      });

      const restoredDestination =
        await transaction.destination
          .findUniqueOrThrow({
            where: {
              id:
                existingDestination.id,
            },

            select: {
              id: true,
              provinceId: true,
              primaryCategoryId: true,
              slug: true,
              name: true,
              shortDescription: true,
              description: true,
              bestTravelTime: true,
              mapQuery: true,
              latitude: true,
              longitude: true,
              status: true,
              isFeatured: true,
              metaTitle: true,
              metaDescription: true,
              publishedAt: true,
              deletedAt: true,

              categories: {
                select: {
                  categoryId: true,
                },
              },
            },
          });

      await transaction.auditLog.create({
        data: {
          actorUserId:
            currentAdminId,

          action:
            'RESTORE_DESTINATION',

          entityType:
            'DESTINATION',

          entityId:
            existingDestination.id,

          oldData:
            this.toAuditSnapshot(
              existingDestination,
            ),

          newData:
            this.toAuditSnapshot(
              restoredDestination,
            ),

          ipAddress:
            auditIpAddress,

          userAgent:
            auditUserAgent,
        },
      });
    },
  );

  const restoredDetail =
    await this.findOne(
      existingDestination.id,
    );

  return {
    success: true,

    message:
      'Khôi phục địa điểm thành công. Địa điểm đã được chuyển về bản nháp.',

    data:
      restoredDetail.data,
  };
}
async uploadImage(
  currentAdminId: string,
  destinationId: string,
  file: Express.Multer.File,
  dto: UploadDestinationImageDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma
      .destination
      .findFirst({
        where: {
          id:
            destinationId,

          deletedAt:
            null,
        },

        select: {
          id:
            true,

          name:
            true,
        },
      });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  if (
    !file ||
    !Buffer.isBuffer(
      file.buffer,
    ) ||
    file.buffer.length === 0
  ) {
    throw new BadRequestException(
      'Bạn chưa chọn file ảnh cần tải lên.',
    );
  }

  const imageType =
    dto.imageType ??
    DestinationImageType.GALLERY;

  const isActive =
    dto.isActive ??
    true;

  if (
    imageType ===
      DestinationImageType.COVER &&
    !isActive
  ) {
    throw new BadRequestException(
      'Ảnh bìa phải ở trạng thái hoạt động.',
    );
  }

  /*
   * Sinh trước UUID của DestinationImage để
   * URL có thể được lưu ngay trong lần INSERT.
   */
  const imageId =
    randomUUID();

  const imageUrl =
    `/api/destination-images/${imageId}/content`;

  /*
   * Upload R2 trước.
   *
   * Nếu upload thất bại, database chưa thay đổi.
   */
  const uploadedImage =
    await this
      .destinationImageStorageService
      .processAndUpload({
        destinationId:
          destination.id,

        buffer:
          file.buffer,

        mimeType:
          file.mimetype,

        originalName:
          file.originalname,
      });

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(
        0,
        64,
      ) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(
        0,
        2000,
      ) ||
    null;

  try {
    const createdImage =
      await this.prisma
        .$transaction(
          async (
            transaction,
          ) => {
            /*
             * Mỗi địa điểm chỉ có một COVER.
             * Ảnh COVER cũ được chuyển thành GALLERY.
             */
            if (
              imageType ===
              DestinationImageType.COVER
            ) {
              await transaction
                .destinationImage
                .updateMany({
                  where: {
                    destinationId:
                      destination.id,

                    imageType:
                      DestinationImageType.COVER,
                  },

                  data: {
                    imageType:
                      DestinationImageType.GALLERY,
                  },
                });
            }

            const image =
              await transaction
                .destinationImage
                .create({
                  data: {
                    id:
                      imageId,

                    destinationId:
                      destination.id,

                    url:
                      imageUrl,

                    storageKey:
                      uploadedImage
                        .objectKey,

                    altText:
                      dto.altText ??
                      `${destination.name} - hình ảnh`,

                    imageType,

                    sourceUrl:
                      dto.sourceUrl ??
                      null,

                    imageCredit:
                      dto.imageCredit ??
                      null,

                    sortOrder:
                      dto.sortOrder ??
                      0,

                    isActive,
                  },
                });

            /*
             * Cập nhật thời gian chỉnh sửa địa điểm
             * và ghi nhận Admin thực hiện thao tác.
             */
            await transaction
              .destination
              .update({
                where: {
                  id:
                    destination.id,
                },

                data: {
                  updatedById:
                    currentAdminId,
                },
              });

            await transaction
              .auditLog
              .create({
                data: {
                  actorUserId:
                    currentAdminId,

                  action:
                    'UPLOAD_DESTINATION_IMAGE',

                  entityType:
                    'DESTINATION_IMAGE',

                  entityId:
                    image.id,

                  oldData:
                    Prisma.DbNull,

                  newData:
                    this
                      .toImageAuditSnapshot(
                        image,
                      ),

                  ipAddress:
                    auditIpAddress,

                  userAgent:
                    auditUserAgent,
                },
              });

            return image;
          },
        );

    return {
      success:
        true,

      message:
        'Tải ảnh địa điểm lên thành công.',

      data: {
        ...createdImage,

        upload: {
          mimeType:
            uploadedImage
              .mimeType,

          fileExtension:
            uploadedImage
              .fileExtension,

          sizeBytes:
            uploadedImage
              .sizeBytes,

          width:
            uploadedImage
              .width,

          height:
            uploadedImage
              .height,
        },
      },
    };
  } catch (error: unknown) {
    /*
     * Database thất bại sau khi R2 đã upload:
     * dọn object để không tạo file rác.
     */
    try {
      await this
        .destinationImageStorageService
        .deleteImageObject(
          uploadedImage.objectKey,
        );
    } catch (
      cleanupError:
        unknown
    ) {
      console.error(
        '[AdminDestinationsService] Không thể dọn ảnh R2 sau lỗi database:',
        {
          objectKey:
            uploadedImage.objectKey,

          error:
            cleanupError instanceof
              Error
              ? cleanupError.message
              : 'UnknownError',
        },
      );
    }

    throw error;
  }
}
async createImage(
  currentAdminId: string,
  destinationId: string,
  dto: CreateDestinationImageDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const imageType =
    dto.imageType ??
    DestinationImageType.GALLERY;

  const isActive =
    dto.isActive ?? true;

  if (
    imageType ===
      DestinationImageType.COVER &&
    !isActive
  ) {
    throw new BadRequestException(
      'Ảnh bìa phải ở trạng thái hoạt động.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const createdImage =
    await this.prisma.$transaction(
      async (transaction) => {
        /*
         * Mỗi địa điểm chỉ có một ảnh COVER.
         */
        if (
          imageType ===
          DestinationImageType.COVER
        ) {
          await transaction
            .destinationImage
            .updateMany({
              where: {
                destinationId:
                  destination.id,

                imageType:
                  DestinationImageType.COVER,
              },

              data: {
                imageType:
                  DestinationImageType.GALLERY,
              },
            });
        }

        const image =
          await transaction
            .destinationImage
            .create({
              data: {
                destinationId:
                  destination.id,

                url:
                  dto.url,

                storageKey:
                  dto.storageKey ??
                  null,

                altText:
                  dto.altText ??
                  `${destination.name} - hình ảnh`,

                imageType,

                sourceUrl:
                  dto.sourceUrl ??
                  null,

                imageCredit:
                  dto.imageCredit ??
                  null,

                sortOrder:
                  dto.sortOrder ?? 0,

                isActive,
              },
            });

        await transaction.auditLog.create({
          data: {
            actorUserId:
              currentAdminId,

            action:
              'CREATE_DESTINATION_IMAGE',

            entityType:
              'DESTINATION_IMAGE',

            entityId:
              image.id,

            oldData:
              Prisma.DbNull,

            newData:
              this.toImageAuditSnapshot(
                image,
              ),

            ipAddress:
              auditIpAddress,

            userAgent:
              auditUserAgent,
          },
        });

        return image;
      },
    );

  return {
    success: true,

    message:
      'Thêm ảnh địa điểm thành công.',

    data:
      createdImage,
  };
}

async updateImage(
  currentAdminId: string,
  destinationId: string,
  imageId: string,
  dto: UpdateDestinationImageDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const hasSubmittedField =
    Object.values(dto).some(
      (value) =>
        value !== undefined,
    );

  if (!hasSubmittedField) {
    throw new BadRequestException(
      'Bạn chưa gửi thông tin ảnh cần cập nhật.',
    );
  }

  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const existingImage =
    await this.prisma
      .destinationImage
      .findFirst({
        where: {
          id: imageId,
          destinationId,
        },
      });

  if (!existingImage) {
    throw new NotFoundException(
      'Không tìm thấy ảnh của địa điểm.',
    );
  }

  const nextImageType =
    dto.imageType ??
    existingImage.imageType;

  const nextIsActive =
    dto.isActive ??
    existingImage.isActive;

  if (
    nextImageType ===
      DestinationImageType.COVER &&
    !nextIsActive
  ) {
    throw new BadRequestException(
      'Ảnh bìa phải ở trạng thái hoạt động.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const updatedImage =
    await this.prisma.$transaction(
      async (transaction) => {
        /*
         * Nếu ảnh này được đặt làm COVER,
         * chuyển ảnh COVER cũ thành GALLERY.
         */
        if (
          nextImageType ===
          DestinationImageType.COVER
        ) {
          await transaction
            .destinationImage
            .updateMany({
              where: {
                destinationId,

                imageType:
                  DestinationImageType.COVER,

                NOT: {
                  id: existingImage.id,
                },
              },

              data: {
                imageType:
                  DestinationImageType.GALLERY,
              },
            });
        }

        const image =
          await transaction
            .destinationImage
            .update({
              where: {
                id:
                  existingImage.id,
              },

              data: {
                ...(dto.url !==
                undefined
                  ? {
                      url:
                        dto.url,
                    }
                  : {}),

                ...(dto.storageKey !==
                undefined
                  ? {
                      storageKey:
                        dto.storageKey,
                    }
                  : {}),

                ...(dto.altText !==
                undefined
                  ? {
                      altText:
                        dto.altText,
                    }
                  : {}),

                ...(dto.imageType !==
                undefined
                  ? {
                      imageType:
                        dto.imageType,
                    }
                  : {}),

                ...(dto.sourceUrl !==
                undefined
                  ? {
                      sourceUrl:
                        dto.sourceUrl,
                    }
                  : {}),

                ...(dto.imageCredit !==
                undefined
                  ? {
                      imageCredit:
                        dto.imageCredit,
                    }
                  : {}),

                ...(dto.sortOrder !==
                undefined
                  ? {
                      sortOrder:
                        dto.sortOrder,
                    }
                  : {}),

                ...(dto.isActive !==
                undefined
                  ? {
                      isActive:
                        dto.isActive,
                    }
                  : {}),
              },
            });

        /*
         * Nếu ảnh bìa cũ không còn là COVER,
         * chọn ảnh hoạt động khác làm bìa.
         */
        const removedCover =
          existingImage.imageType ===
            DestinationImageType.COVER &&
          (
            image.imageType !==
              DestinationImageType.COVER ||
            !image.isActive
          );

        if (removedCover) {
          const replacementImage =
            await transaction
              .destinationImage
              .findFirst({
                where: {
                  destinationId,

                  isActive: true,

                  NOT: {
                    id: image.id,
                  },
                },

                orderBy: [
                  {
                    sortOrder:
                      'asc',
                  },
                  {
                    id:
                      'asc',
                  },
                ],

                select: {
                  id: true,
                },
              });

          if (replacementImage) {
            await transaction
              .destinationImage
              .update({
                where: {
                  id:
                    replacementImage.id,
                },

                data: {
                  imageType:
                    DestinationImageType.COVER,
                },
              });
          }
        }

        await transaction.auditLog.create({
          data: {
            actorUserId:
              currentAdminId,

            action:
              'UPDATE_DESTINATION_IMAGE',

            entityType:
              'DESTINATION_IMAGE',

            entityId:
              image.id,

            oldData:
              this.toImageAuditSnapshot(
                existingImage,
              ),

            newData:
              this.toImageAuditSnapshot(
                image,
              ),

            ipAddress:
              auditIpAddress,

            userAgent:
              auditUserAgent,
          },
        });

        return image;
      },
    );

  return {
    success: true,

    message:
      'Cập nhật ảnh địa điểm thành công.',

    data:
      updatedImage,
  };
}

async deleteImage(
  currentAdminId: string,
  destinationId: string,
  imageId: string,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma
      .destination
      .findFirst({
        where: {
          id:
            destinationId,

          deletedAt:
            null,
        },

        select: {
          id:
            true,
        },
      });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const existingImage =
    await this.prisma
      .destinationImage
      .findFirst({
        where: {
          id:
            imageId,

          destinationId,
        },
      });

  if (!existingImage) {
    throw new NotFoundException(
      'Không tìm thấy ảnh của địa điểm.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(
        0,
        64,
      ) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(
        0,
        2000,
      ) ||
    null;

  const submittedStorageKey =
    existingImage.storageKey
      ?.trim() ||
    '';

  const managedStorageKey =
    submittedStorageKey
      .startsWith(
        'destinations/',
      )
      ? submittedStorageKey
      : null;

  /*
   * Xóa object thật khỏi R2 trước.
   *
   * Nếu R2 gặp lỗi, database chưa bị thay đổi
   * và Admin có thể thử lại.
   *
   * Với ảnh local hoặc URL cũ không có
   * storageKey, chỉ xóa metadata trong Neon.
   */
  if (managedStorageKey) {
    await this
      .destinationImageStorageService
      .deleteImageObject(
        managedStorageKey,
      );
  } else if (submittedStorageKey) {
    console.warn(
      '[AdminDestinationsService] Bỏ qua xóa R2 vì storageKey không thuộc destinations/:',
      {
        imageId:
          existingImage.id,

        storageKey:
          submittedStorageKey,
      },
    );
  }

  try {
    await this.prisma.$transaction(
      async (transaction) => {
        await transaction
          .destinationImage
          .delete({
            where: {
              id:
                existingImage.id,
            },
          });

        /*
         * Nếu xóa ảnh bìa, chọn ảnh hoạt động
         * đầu tiên còn lại làm ảnh bìa.
         */
        if (
          existingImage.imageType ===
          DestinationImageType.COVER
        ) {
          const replacementImage =
            await transaction
              .destinationImage
              .findFirst({
                where: {
                  destinationId,

                  isActive:
                    true,
                },

                orderBy: [
                  {
                    sortOrder:
                      'asc',
                  },
                  {
                    id:
                      'asc',
                  },
                ],

                select: {
                  id:
                    true,
                },
              });

          if (replacementImage) {
            await transaction
              .destinationImage
              .update({
                where: {
                  id:
                    replacementImage.id,
                },

                data: {
                  imageType:
                    DestinationImageType.COVER,
                },
              });
          }
        }

        await transaction
          .destination
          .update({
            where: {
              id:
                destination.id,
            },

            data: {
              updatedById:
                currentAdminId,
            },
          });

        await transaction
          .auditLog
          .create({
            data: {
              actorUserId:
                currentAdminId,

              action:
                'DELETE_DESTINATION_IMAGE',

              entityType:
                'DESTINATION_IMAGE',

              entityId:
                existingImage.id,

              oldData:
                this.toImageAuditSnapshot(
                  existingImage,
                ),

              newData:
                Prisma.DbNull,

              ipAddress:
                auditIpAddress,

              userAgent:
                auditUserAgent,
            },
          });
      },
    );
  } catch (error: unknown) {
    /*
     * R2 có thể đã xóa thành công nhưng
     * transaction database gặp lỗi.
     * Ghi log rõ để có thể kiểm tra thủ công.
     */
    console.error(
      '[AdminDestinationsService] Không thể xóa metadata ảnh sau khi đã xử lý R2:',
      {
        imageId:
          existingImage.id,

        storageKey:
          managedStorageKey,

        error:
          error instanceof Error
            ? error.message
            : 'UnknownError',
      },
    );

    throw error;
  }

  return {
    success:
      true,

    message:
      managedStorageKey
        ? 'Đã xóa hình ảnh khỏi Cloudflare R2 và database.'
        : 'Đã xóa hình ảnh khỏi database.',

    data: {
      id:
        existingImage.id,

      destinationId,

      deletedFromStorage:
        Boolean(
          managedStorageKey,
        ),
    },
  };
}

async createFeature(
  currentAdminId: string,
  destinationId: string,
  dto: CreateDestinationFeatureDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const createdFeature =
    await this.prisma.$transaction(
      async (transaction) => {
        const feature =
          await transaction
            .destinationFeature
            .create({
              data: {
                destinationId:
                  destination.id,

                title:
                  dto.title,

                content:
                  dto.content,

                icon:
                  dto.icon ?? null,

                sortOrder:
                  dto.sortOrder ?? 0,
              },
            });

        await transaction.destination.update({
          where: {
            id: destination.id,
          },

          data: {
            updatedById:
              currentAdminId,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId:
              currentAdminId,

            action:
              'CREATE_DESTINATION_FEATURE',

            entityType:
              'DESTINATION_FEATURE',

            entityId:
              feature.id,

            oldData:
              Prisma.DbNull,

            newData:
              this.toFeatureAuditSnapshot(
                feature,
              ),

            ipAddress:
              auditIpAddress,

            userAgent:
              auditUserAgent,
          },
        });

        return feature;
      },
    );

  return {
    success: true,

    message:
      'Thêm đặc điểm nổi bật thành công.',

    data:
      createdFeature,
  };
}

async updateFeature(
  currentAdminId: string,
  destinationId: string,
  featureId: string,
  dto: UpdateDestinationFeatureDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const hasSubmittedField =
    Object.values(dto).some(
      (value) =>
        value !== undefined,
    );

  if (!hasSubmittedField) {
    throw new BadRequestException(
      'Bạn chưa gửi thông tin đặc điểm cần cập nhật.',
    );
  }

  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const existingFeature =
    await this.prisma
      .destinationFeature
      .findFirst({
        where: {
          id: featureId,
          destinationId,
        },
      });

  if (!existingFeature) {
    throw new NotFoundException(
      'Không tìm thấy đặc điểm nổi bật của địa điểm.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const updatedFeature =
    await this.prisma.$transaction(
      async (transaction) => {
        const feature =
          await transaction
            .destinationFeature
            .update({
              where: {
                id:
                  existingFeature.id,
              },

              data: {
                ...(dto.title !== undefined
                  ? {
                      title:
                        dto.title,
                    }
                  : {}),

                ...(dto.content !== undefined
                  ? {
                      content:
                        dto.content,
                    }
                  : {}),

                ...(dto.icon !== undefined
                  ? {
                      icon:
                        dto.icon,
                    }
                  : {}),

                ...(dto.sortOrder !== undefined
                  ? {
                      sortOrder:
                        dto.sortOrder,
                    }
                  : {}),
              },
            });

        await transaction.destination.update({
          where: {
            id: destination.id,
          },

          data: {
            updatedById:
              currentAdminId,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId:
              currentAdminId,

            action:
              'UPDATE_DESTINATION_FEATURE',

            entityType:
              'DESTINATION_FEATURE',

            entityId:
              feature.id,

            oldData:
              this.toFeatureAuditSnapshot(
                existingFeature,
              ),

            newData:
              this.toFeatureAuditSnapshot(
                feature,
              ),

            ipAddress:
              auditIpAddress,

            userAgent:
              auditUserAgent,
          },
        });

        return feature;
      },
    );

  return {
    success: true,

    message:
      'Cập nhật đặc điểm nổi bật thành công.',

    data:
      updatedFeature,
  };
}

async deleteFeature(
  currentAdminId: string,
  destinationId: string,
  featureId: string,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const existingFeature =
    await this.prisma
      .destinationFeature
      .findFirst({
        where: {
          id: featureId,
          destinationId,
        },
      });

  if (!existingFeature) {
    throw new NotFoundException(
      'Không tìm thấy đặc điểm nổi bật của địa điểm.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  await this.prisma.$transaction(
    async (transaction) => {
      await transaction
        .destinationFeature
        .delete({
          where: {
            id:
              existingFeature.id,
          },
        });

      await transaction.destination.update({
        where: {
          id: destination.id,
        },

        data: {
          updatedById:
            currentAdminId,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId:
            currentAdminId,

          action:
            'DELETE_DESTINATION_FEATURE',

          entityType:
            'DESTINATION_FEATURE',

          entityId:
            existingFeature.id,

          oldData:
            this.toFeatureAuditSnapshot(
              existingFeature,
            ),

          newData:
            Prisma.DbNull,

          ipAddress:
            auditIpAddress,

          userAgent:
            auditUserAgent,
        },
      });
    },
  );

  return {
    success: true,

    message:
      'Xóa đặc điểm nổi bật thành công.',

    data: {
      id:
        existingFeature.id,

      destinationId,
    },
  };
}

async createAttraction(
  currentAdminId: string,
  destinationId: string,
  dto: CreateDestinationAttractionDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const createdAttraction =
    await this.prisma.$transaction(
      async (transaction) => {
        const attraction =
          await transaction
            .destinationAttraction
            .create({
              data: {
                destinationId:
                  destination.id,

                name:
                  dto.name,

                description:
                  dto.description ??
                  null,

                address:
                  dto.address ??
                  null,

                mapQuery:
                  dto.mapQuery ??
                  null,

                latitude:
                  dto.latitude ??
                  null,

                longitude:
                  dto.longitude ??
                  null,

                imageUrl:
                  dto.imageUrl ??
                  null,

                imageAlt:
                  dto.imageAlt ??
                  (
                    dto.imageUrl
                      ? `${dto.name} tại ${destination.name}`
                      : null
                  ),

                sourceUrl:
                  dto.sourceUrl ??
                  null,

                imageCredit:
                  dto.imageCredit ??
                  null,

                sortOrder:
                  dto.sortOrder ?? 0,

                isActive:
                  dto.isActive ?? true,
              },
            });

        await transaction.destination.update({
          where: {
            id: destination.id,
          },

          data: {
            updatedById:
              currentAdminId,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId:
              currentAdminId,

            action:
              'CREATE_DESTINATION_ATTRACTION',

            entityType:
              'DESTINATION_ATTRACTION',

            entityId:
              attraction.id,

            oldData:
              Prisma.DbNull,

            newData:
              this.toAttractionAuditSnapshot(
                attraction,
              ),

            ipAddress:
              auditIpAddress,

            userAgent:
              auditUserAgent,
          },
        });

        return attraction;
      },
    );

  return {
    success: true,

    message:
      'Thêm điểm khám phá thành công.',

    data:
      createdAttraction,
  };
}
async updateAttraction(
  currentAdminId: string,
  destinationId: string,
  attractionId: string,
  dto: UpdateDestinationAttractionDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const hasSubmittedField =
    Object.values(dto).some(
      (value) =>
        value !== undefined,
    );

  if (!hasSubmittedField) {
    throw new BadRequestException(
      'Bạn chưa gửi thông tin điểm khám phá cần cập nhật.',
    );
  }

  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const existingAttraction =
    await this.prisma
      .destinationAttraction
      .findFirst({
        where: {
          id: attractionId,
          destinationId,
        },
      });

  if (!existingAttraction) {
    throw new NotFoundException(
      'Không tìm thấy điểm khám phá của địa điểm.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const updatedAttraction =
    await this.prisma.$transaction(
      async (transaction) => {
        const attraction =
          await transaction
            .destinationAttraction
            .update({
              where: {
                id:
                  existingAttraction.id,
              },

              data: {
                ...(dto.name !== undefined
                  ? {
                      name:
                        dto.name,
                    }
                  : {}),

                ...(dto.description !== undefined
                  ? {
                      description:
                        dto.description,
                    }
                  : {}),

                ...(dto.address !== undefined
                  ? {
                      address:
                        dto.address,
                    }
                  : {}),

                ...(dto.mapQuery !== undefined
                  ? {
                      mapQuery:
                        dto.mapQuery,
                    }
                  : {}),

                ...(dto.latitude !== undefined
                  ? {
                      latitude:
                        dto.latitude,
                    }
                  : {}),

                ...(dto.longitude !== undefined
                  ? {
                      longitude:
                        dto.longitude,
                    }
                  : {}),

                ...(dto.imageUrl !== undefined
                  ? {
                      imageUrl:
                        dto.imageUrl,
                    }
                  : {}),

                ...(dto.imageAlt !== undefined
                  ? {
                      imageAlt:
                        dto.imageAlt,
                    }
                  : {}),

                ...(dto.sourceUrl !== undefined
                  ? {
                      sourceUrl:
                        dto.sourceUrl,
                    }
                  : {}),

                ...(dto.imageCredit !== undefined
                  ? {
                      imageCredit:
                        dto.imageCredit,
                    }
                  : {}),

                ...(dto.sortOrder !== undefined
                  ? {
                      sortOrder:
                        dto.sortOrder,
                    }
                  : {}),

                ...(dto.isActive !== undefined
                  ? {
                      isActive:
                        dto.isActive,
                    }
                  : {}),
              },
            });

        await transaction.destination.update({
          where: {
            id: destination.id,
          },

          data: {
            updatedById:
              currentAdminId,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId:
              currentAdminId,

            action:
              'UPDATE_DESTINATION_ATTRACTION',

            entityType:
              'DESTINATION_ATTRACTION',

            entityId:
              attraction.id,

            oldData:
              this.toAttractionAuditSnapshot(
                existingAttraction,
              ),

            newData:
              this.toAttractionAuditSnapshot(
                attraction,
              ),

            ipAddress:
              auditIpAddress,

            userAgent:
              auditUserAgent,
          },
        });

        return attraction;
      },
    );

  return {
    success: true,

    message:
      'Cập nhật điểm khám phá thành công.',

    data:
      updatedAttraction,
  };
}

async deleteAttraction(
  currentAdminId: string,
  destinationId: string,
  attractionId: string,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const existingAttraction =
    await this.prisma
      .destinationAttraction
      .findFirst({
        where: {
          id: attractionId,
          destinationId,
        },
      });

  if (!existingAttraction) {
    throw new NotFoundException(
      'Không tìm thấy điểm khám phá của địa điểm.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  await this.prisma.$transaction(
    async (transaction) => {
      await transaction
        .destinationAttraction
        .delete({
          where: {
            id:
              existingAttraction.id,
          },
        });

      await transaction.destination.update({
        where: {
          id: destination.id,
        },

        data: {
          updatedById:
            currentAdminId,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId:
            currentAdminId,

          action:
            'DELETE_DESTINATION_ATTRACTION',

          entityType:
            'DESTINATION_ATTRACTION',

          entityId:
            existingAttraction.id,

          oldData:
            this.toAttractionAuditSnapshot(
              existingAttraction,
            ),

          newData:
            Prisma.DbNull,

          ipAddress:
            auditIpAddress,

          userAgent:
            auditUserAgent,
        },
      });
    },
  );

  return {
    success: true,

    message:
      'Xóa điểm khám phá thành công.',

    data: {
      id:
        existingAttraction.id,

      destinationId,
    },
  };
}
async createFood(
  currentAdminId: string,
  destinationId: string,
  dto: CreateDestinationFoodDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  if (
    dto.priceMin !== undefined &&
    dto.priceMax !== undefined &&
    dto.priceMin > dto.priceMax
  ) {
    throw new BadRequestException(
      'Giá thấp nhất không được lớn hơn giá cao nhất.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const createdFood =
    await this.prisma.$transaction(
      async (transaction) => {
        const food =
          await transaction.destinationFood.create({
            data: {
              destinationId:
                destination.id,

              name:
                dto.name,

              description:
                dto.description ??
                null,

              imageUrl:
                dto.imageUrl ??
                null,

              imageAlt:
                dto.imageAlt ??
                (
                  dto.imageUrl
                    ? `${dto.name} tại ${destination.name}`
                    : null
                ),

              priceMin:
                dto.priceMin ??
                null,

              priceMax:
                dto.priceMax ??
                null,

              priceNote:
                dto.priceNote ??
                null,

              suggestedArea:
                dto.suggestedArea ??
                null,

              sourceUrl:
                dto.sourceUrl ??
                null,

              imageCredit:
                dto.imageCredit ??
                null,

              sortOrder:
                dto.sortOrder ?? 0,

              isActive:
                dto.isActive ?? true,
            },
          });

        await transaction.destination.update({
          where: {
            id: destination.id,
          },

          data: {
            updatedById:
              currentAdminId,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId:
              currentAdminId,

            action:
              'CREATE_DESTINATION_FOOD',

            entityType:
              'DESTINATION_FOOD',

            entityId:
              food.id,

            oldData:
              Prisma.DbNull,

            newData:
              this.toFoodAuditSnapshot(
                food,
              ),

            ipAddress:
              auditIpAddress,

            userAgent:
              auditUserAgent,
          },
        });

        return food;
      },
    );

  return {
    success: true,

    message:
      'Thêm món ăn gợi ý thành công.',

    data:
      createdFood,
  };
}
async uploadFoodImage(
  currentAdminId: string,
  destinationId: string,
  foodId: string,
  file: Express.Multer.File,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id:
          destinationId,

        deletedAt:
          null,
      },

      select: {
        id:
          true,

        name:
          true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const existingFood =
    await this.prisma
      .destinationFood
      .findFirst({
        where: {
          id:
            foodId,

          destinationId:
            destination.id,
        },
      });

  if (!existingFood) {
    throw new NotFoundException(
      'Không tìm thấy món ăn của địa điểm.',
    );
  }

  if (
    !file ||
    !Buffer.isBuffer(
      file.buffer,
    ) ||
    file.buffer.length === 0
  ) {
    throw new BadRequestException(
      'Bạn chưa chọn file ảnh món ăn cần tải lên.',
    );
  }

  /*
   * Ảnh món ăn dùng object key cố định.
   * Upload lần sau sẽ thay đúng file cũ,
   * không sinh file rác trên R2.
   */
  const objectKey =
    [
      'destinations',
      destination.id,
      'foods',
      `${existingFood.id}.webp`,
    ].join('/');

  const uploadedImage =
    await this
      .destinationImageStorageService
      .processAndUpload({
        destinationId:
          destination.id,

        buffer:
          file.buffer,

        mimeType:
          file.mimetype,

        originalName:
          file.originalname,

        objectKey,
      });

  /*
   * Thêm version vào URL để trình duyệt không
   * giữ ảnh cũ sau khi Admin thay file.
   */
  const imageUrl =
    (
      `/api/destination-images/foods/` +
      `${existingFood.id}/content` +
      `?v=${Date.now()}`
    );

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const updatedFood =
    await this.prisma.$transaction(
      async (transaction) => {
        const food =
          await transaction
            .destinationFood
            .update({
              where: {
                id:
                  existingFood.id,
              },

              data: {
                imageUrl,

                imageAlt:
                  existingFood.imageAlt ??
                  `${existingFood.name} tại ${destination.name}`,
              },
            });

        await transaction.destination.update({
          where: {
            id:
              destination.id,
          },

          data: {
            updatedById:
              currentAdminId,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId:
              currentAdminId,

            action:
              'UPLOAD_DESTINATION_FOOD_IMAGE',

            entityType:
              'DESTINATION_FOOD',

            entityId:
              food.id,

            oldData:
              this.toFoodAuditSnapshot(
                existingFood,
              ),

            newData:
              this.toFoodAuditSnapshot(
                food,
              ),

            ipAddress:
              auditIpAddress,

            userAgent:
              auditUserAgent,
          },
        });

        return food;
      },
    );

  return {
    success: true,

    message:
      'Tải ảnh món ăn lên thành công.',

    data: {
      ...updatedFood,

      upload: {
        objectKey:
          uploadedImage.objectKey,

        mimeType:
          uploadedImage.mimeType,

        fileExtension:
          uploadedImage.fileExtension,

        sizeBytes:
          uploadedImage.sizeBytes,

        width:
          uploadedImage.width,

        height:
          uploadedImage.height,
      },
    },
  };
}

async updateFood(
  currentAdminId: string,
  destinationId: string,
  foodId: string,
  dto: UpdateDestinationFoodDto,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const hasSubmittedField =
    Object.values(dto).some(
      (value) =>
        value !== undefined,
    );

  if (!hasSubmittedField) {
    throw new BadRequestException(
      'Bạn chưa gửi thông tin món ăn cần cập nhật.',
    );
  }

  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const existingFood =
    await this.prisma.destinationFood.findFirst({
      where: {
        id: foodId,
        destinationId,
      },
    });

  if (!existingFood) {
    throw new NotFoundException(
      'Không tìm thấy món ăn của địa điểm.',
    );
  }

  const nextPriceMin =
    dto.priceMin !== undefined
      ? dto.priceMin
      : existingFood.priceMin;

  const nextPriceMax =
    dto.priceMax !== undefined
      ? dto.priceMax
      : existingFood.priceMax;

  if (
    nextPriceMin !== null &&
    nextPriceMax !== null &&
    nextPriceMin > nextPriceMax
  ) {
    throw new BadRequestException(
      'Giá thấp nhất không được lớn hơn giá cao nhất.',
    );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  const updatedFood =
    await this.prisma.$transaction(
      async (transaction) => {
        const food =
          await transaction.destinationFood.update({
            where: {
              id: existingFood.id,
            },

            data: {
              ...(dto.name !== undefined
                ? {
                    name:
                      dto.name,
                  }
                : {}),

              ...(dto.description !== undefined
                ? {
                    description:
                      dto.description,
                  }
                : {}),

              ...(dto.imageUrl !== undefined
                ? {
                    imageUrl:
                      dto.imageUrl,
                  }
                : {}),

              ...(dto.imageAlt !== undefined
                ? {
                    imageAlt:
                      dto.imageAlt,
                  }
                : {}),

              ...(dto.priceMin !== undefined
                ? {
                    priceMin:
                      dto.priceMin,
                  }
                : {}),

              ...(dto.priceMax !== undefined
                ? {
                    priceMax:
                      dto.priceMax,
                  }
                : {}),

              ...(dto.priceNote !== undefined
                ? {
                    priceNote:
                      dto.priceNote,
                  }
                : {}),

              ...(dto.suggestedArea !== undefined
                ? {
                    suggestedArea:
                      dto.suggestedArea,
                  }
                : {}),

              ...(dto.sourceUrl !== undefined
                ? {
                    sourceUrl:
                      dto.sourceUrl,
                  }
                : {}),

              ...(dto.imageCredit !== undefined
                ? {
                    imageCredit:
                      dto.imageCredit,
                  }
                : {}),

              ...(dto.sortOrder !== undefined
                ? {
                    sortOrder:
                      dto.sortOrder,
                  }
                : {}),

              ...(dto.isActive !== undefined
                ? {
                    isActive:
                      dto.isActive,
                  }
                : {}),
            },
          });

        await transaction.destination.update({
          where: {
            id: destination.id,
          },

          data: {
            updatedById:
              currentAdminId,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId:
              currentAdminId,

            action:
              'UPDATE_DESTINATION_FOOD',

            entityType:
              'DESTINATION_FOOD',

            entityId:
              food.id,

            oldData:
              this.toFoodAuditSnapshot(
                existingFood,
              ),

            newData:
              this.toFoodAuditSnapshot(
                food,
              ),

            ipAddress:
              auditIpAddress,

            userAgent:
              auditUserAgent,
          },
        });

        return food;
      },
    );

  return {
    success: true,

    message:
      'Cập nhật món ăn gợi ý thành công.',

    data:
      updatedFood,
  };
}
async deleteFood(
  currentAdminId: string,
  destinationId: string,
  foodId: string,
  requestInfo:
    AdminDestinationAuditRequestInfo,
) {
  const destination =
    await this.prisma.destination.findFirst({
      where: {
        id: destinationId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

  if (!destination) {
    throw new NotFoundException(
      'Không tìm thấy địa điểm.',
    );
  }

  const existingFood =
    await this.prisma.destinationFood.findFirst({
      where: {
        id: foodId,
        destinationId,
      },
    });

  if (!existingFood) {
    throw new NotFoundException(
      'Không tìm thấy món ăn của địa điểm.',
    );
  }

  const internalImagePrefix =
    `/api/destination-images/foods/${existingFood.id}/content`;

  if (
    existingFood.imageUrl
      ?.startsWith(
        internalImagePrefix,
      )
  ) {
    const objectKey =
      [
        'destinations',
        destinationId,
        'foods',
        `${existingFood.id}.webp`,
      ].join('/');

    /*
     * Xóa object trước khi xóa database.
     * Hàm deleteImageObject là idempotent.
     */
    await this
      .destinationImageStorageService
      .deleteImageObject(
        objectKey,
      );
  }

  const auditIpAddress =
    requestInfo.ipAddress
      ?.trim()
      .slice(0, 64) ||
    null;

  const auditUserAgent =
    requestInfo.userAgent
      ?.trim()
      .slice(0, 2000) ||
    null;

  await this.prisma.$transaction(
    async (transaction) => {
      await transaction.destinationFood.delete({
        where: {
          id: existingFood.id,
        },
      });

      await transaction.destination.update({
        where: {
          id: destination.id,
        },

        data: {
          updatedById:
            currentAdminId,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId:
            currentAdminId,

          action:
            'DELETE_DESTINATION_FOOD',

          entityType:
            'DESTINATION_FOOD',

          entityId:
            existingFood.id,

          oldData:
            this.toFoodAuditSnapshot(
              existingFood,
            ),

          newData:
            Prisma.DbNull,

          ipAddress:
            auditIpAddress,

          userAgent:
            auditUserAgent,
        },
      });
    },
  );

  return {
    success: true,

    message:
      'Xóa món ăn gợi ý thành công.',

    data: {
      id:
        existingFood.id,

      destinationId,
    },
  };
}
async getFormOptions() {
  const [
    regions,
    categories,
  ] = await Promise.all([
    this.prisma.region.findMany({
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],

      select: {
        id: true,
        name: true,
        slug: true,

        provinces: {
          orderBy: {
            name: 'asc',
          },

          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),

    this.prisma.category.findMany({
      where: {
        isActive: true,
      },

      orderBy: {
        name: 'asc',
      },

      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
      },
    }),
  ]);

  return {
    success: true,

    data: {
      regions,
      categories,
    },
  };
}
  async findOne(
    destinationId: string,
  ) {
    const destination =
      await this.prisma
        .destination
        .findFirst({
          where: {
            id: destinationId,
          },

          select: {
            id: true,
            slug: true,
            name: true,

            shortDescription:
              true,

            description: true,

            bestTravelTime:
              true,

            mapQuery: true,
            latitude: true,
            longitude: true,

            status: true,
            isFeatured: true,

            metaTitle: true,
            metaDescription:
              true,

            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,

            province: {
              select: {
                id: true,
                name: true,
                slug: true,

                region: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },

            primaryCategory: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },

            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true,
                  },
                },
              },
            },

            images: {
            orderBy: [
              {
                imageType: 'asc',
              },
              {
                sortOrder: 'asc',
              },
            ],

              select: {
                id: true,
                url: true,
                storageKey: true,
                altText: true,
                imageType: true,
                sourceUrl: true,
                imageCredit: true,
                sortOrder: true,
                isActive: true,
              },
            },

            features: {
              orderBy: {
                sortOrder: 'asc',
              },

              select: {
                id: true,
                title: true,
                content: true,
                icon: true,
                sortOrder: true,
              },
            },

            attractions: {
              orderBy: {
                sortOrder: 'asc',
              },

              select: {
                id: true,
                name: true,
                description: true,
                address: true,
                mapQuery: true,
                latitude: true,
                longitude: true,
                imageUrl: true,
                imageAlt: true,
                sourceUrl: true,
                imageCredit: true,
                sortOrder: true,
                isActive: true,
              },
            },

            foods: {
              orderBy: {
                sortOrder: 'asc',
              },

              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                imageAlt: true,
                priceMin: true,
                priceMax: true,
                priceNote: true,
                suggestedArea: true,
                sourceUrl: true,
                imageCredit: true,
                sortOrder: true,
                isActive: true,
              },
            },

            contentBlocks: {
              orderBy: {
                sortOrder: 'asc',
              },

              select: {
                id: true,
                type: true,
                title: true,
                content: true,
                sortOrder: true,
                isActive: true,
              },
            },

            createdBy: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },

            updatedBy: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        });

    if (!destination) {
      throw new NotFoundException(
        'Không tìm thấy địa điểm.',
      );
    }

    return {
      success: true,

      data: {
        ...destination,

        region:
          destination
            .province
            .region,

        categories:
          destination.categories
            .map(
              (item) =>
                item.category,
            )
            .sort(
              (
                firstCategory,
                secondCategory,
              ) =>
                firstCategory
                  .name
                  .localeCompare(
                    secondCategory
                      .name,
                    'vi',
                  ),
            ),
      },
    };
  }
}