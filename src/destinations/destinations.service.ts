import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DestinationStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

import type { Prisma } from '../generated/prisma/client';

import { FindDestinationsQueryDto } from './dto/find-destinations-query.dto';

@Injectable()
export class DestinationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}
  /**
   * Chuyển chuỗi tiếng Việt thành dạng gần giống slug.
   *
   * Ví dụ:
   * "Đà Lạt"       -> "da-lat"
   * "Miền Trung"   -> "mien-trung"
   * "Biển đảo"     -> "bien-dao"
   */
  private toSearchSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
private hasVietnameseDiacritics(
  value: string,
): boolean {
  const normalizedValue =
    value.normalize('NFD');

  const valueWithoutMarks =
    normalizedValue.replace(
      /[\u0300-\u036f]/g,
      '',
    );

  return (
    normalizedValue !== valueWithoutMarks ||
    /đ/i.test(value)
  );
}
  private buildListWhere(
    query: FindDestinationsQueryDto,
  ): Prisma.DestinationWhereInput {
    const conditions:
      Prisma.DestinationWhereInput[] = [];

    /*
     * 1. Tìm kiếm theo từ khóa.
     *
     * Có thể tìm bằng:
     * - Tên địa điểm
     * - Slug địa điểm
     * - Tỉnh/thành
     * - Vùng miền
     * - Danh mục
     */
    if (query.q) {
  const keyword = query.q;

  const keywordSlug =
    this.toSearchSlug(keyword);

  const hasVietnameseDiacritics =
    this.hasVietnameseDiacritics(
      keyword,
    );

  const keywordConditions:
    Prisma.DestinationWhereInput[] = [
      /*
       * Tìm trực tiếp theo tên có dấu.
       *
       * Ví dụ:
       * "đà" chỉ khớp Đà Lạt và Đà Nẵng,
       * không khớp Côn Đảo.
       */
      {
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
    ];

  /*
   * Khi người dùng nhập không dấu,
   * tìm thêm trên slug địa điểm.
   *
   * Ví dụ:
   * "da lat" -> "da-lat"
   * "nha trang" -> "nha-trang"
   */
  if (
    !hasVietnameseDiacritics &&
    keywordSlug
  ) {
    keywordConditions.push({
      slug: {
        startsWith: keywordSlug,
        mode: 'insensitive',
      },
    });

    /*
     * Hỗ trợ tìm theo từ phía sau.
     *
     * Ví dụ:
     * "lat"  -> da-lat
     * "nang" -> da-nang
     *
     * Chỉ áp dụng từ 3 ký tự để tránh
     * từ ngắn "da" khớp nhầm "dao".
     */
    if (keywordSlug.length >= 3) {
      keywordConditions.push({
        slug: {
          contains: `-${keywordSlug}`,
          mode: 'insensitive',
        },
      });
    }
  }

  conditions.push({
    OR: keywordConditions,
  });
}

    /*
     * 2. Lọc chính xác theo vùng miền.
     *
     * Chấp nhận cả tên và slug.
     */
    if (query.region) {
      const regionSlug =
        this.toSearchSlug(query.region);

      conditions.push({
        province: {
          is: {
            region: {
              is: {
                OR: [
                  {
                    name: {
                      equals: query.region,
                      mode: 'insensitive',
                    },
                  },
                  {
                    slug: {
                      equals: regionSlug,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        },
      });
    }

    /*
     * 3. Lọc chính xác theo danh mục.
     *
     * Kiểm tra cả:
     * - Danh mục chính
     * - Danh mục được liên kết
     */
    if (query.category) {
      const categorySlug =
        this.toSearchSlug(query.category);

      conditions.push({
        OR: [
          {
            primaryCategory: {
              is: {
                OR: [
                  {
                    name: {
                      equals: query.category,
                      mode: 'insensitive',
                    },
                  },
                  {
                    slug: {
                      equals: categorySlug,
                      mode: 'insensitive',
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
                    isActive: true,

                    OR: [
                      {
                        name: {
                          equals:
                            query.category,
                          mode: 'insensitive',
                        },
                      },
                      {
                        slug: {
                          equals:
                            categorySlug,
                          mode: 'insensitive',
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

    return {
      status: DestinationStatus.PUBLISHED,
      deletedAt: null,

      ...(conditions.length > 0
        ? {
            AND: conditions,
          }
        : {}),
    };
  }


 async findAll(
  query: FindDestinationsQueryDto,
) {
const where =
  this.buildListWhere(query);

const destinations =
  await this.prisma.destination.findMany({
    where,

        orderBy: [
          {
            isFeatured: 'desc',
          },
          {
            name: 'asc',
          },
        ],

        select: {
          id: true,
          slug: true,
          name: true,
          shortDescription: true,
          bestTravelTime: true,

          province: {
            select: {
              name: true,

              region: {
                select: {
                  name: true,
                },
              },
            },
          },

          primaryCategory: {
            select: {
              name: true,
            },
          },

          categories: {
            select: {
              category: {
                select: {
                  name: true,
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

            select: {
              url: true,
            },
          },
        },
      });

    return destinations.map((destination) => ({
      /*
      * Giữ id là slug để tương thích
      * với frontend cũ.
      */
      id: destination.slug,

      /*
      * UUID thật trong PostgreSQL.
      * Dùng cho các quan hệ database,
      * ví dụ TtsJob.destinationId.
      */
      databaseId: destination.id,

      slug: destination.slug,
      name: destination.name,

      province: destination.province.name,
      region: destination.province.region.name,

      type:
        destination.primaryCategory?.name ?? null,

      categories: destination.categories
        .map((item) => item.category.name)
        .sort((firstName, secondName) =>
          firstName.localeCompare(
            secondName,
            'vi',
          ),
        ),

      time: destination.bestTravelTime,

      images: destination.images.map(
        (image) => image.url,
      ),

      shortDescription:
        destination.shortDescription,
    }));
  }


  /**
   * Tạo hai nhóm gợi ý cho trang chi tiết:
   *
   * - related:
   *   ưu tiên cùng tỉnh, cùng khu vực và cùng danh mục.
   *
   * - featuredElsewhere:
   *   ưu tiên địa điểm nổi bật ở tỉnh/thành khác,
   *   sau đó xét lượt xem, ảnh đại diện và tên.
   *
   * Không cần thêm bảng hoặc cột mới trong database.
   */
  async findRecommendationsBySlug(
    slug: string,
  ) {
    const normalizedSlug = slug
      .trim()
      .toLowerCase();

    const currentDestination =
      await this.prisma.destination.findFirst({
        where: {
          slug: normalizedSlug,
          status: DestinationStatus.PUBLISHED,
          deletedAt: null,
        },

        select: {
          id: true,
          provinceId: true,
          primaryCategoryId: true,

          province: {
            select: {
              name: true,
              regionId: true,

              region: {
                select: {
                  name: true,
                },
              },
            },
          },

          categories: {
            select: {
              categoryId: true,
            },
          },
        },
      });

    if (!currentDestination) {
      throw new NotFoundException(
        `Không tìm thấy địa điểm có slug "${normalizedSlug}".`,
      );
    }

    const candidates =
      await this.prisma.destination.findMany({
        where: {
          id: {
            not: currentDestination.id,
          },

          status: DestinationStatus.PUBLISHED,
          deletedAt: null,
        },

        select: {
          id: true,
          slug: true,
          name: true,
          shortDescription: true,
          bestTravelTime: true,
          isFeatured: true,
          provinceId: true,
          primaryCategoryId: true,

          province: {
            select: {
              name: true,
              regionId: true,

              region: {
                select: {
                  name: true,
                },
              },
            },
          },

          primaryCategory: {
            select: {
              name: true,
            },
          },

          categories: {
            select: {
              categoryId: true,

              category: {
                select: {
                  name: true,
                },
              },
            },
          },

          images: {
            where: {
              isActive: true,
            },

            orderBy: {
              sortOrder: 'asc',
            },

            take: 1,

            select: {
              url: true,
            },
          },

          _count: {
            select: {
              views: true,
            },
          },
        },
      });

    const currentCategoryIds =
      new Set<string>(
        [
          currentDestination.primaryCategoryId,
          ...currentDestination.categories.map(
            (item) => item.categoryId,
          ),
        ].filter(
          (value): value is string =>
            Boolean(value),
        ),
      );

    const scoredCandidates =
      candidates.map((candidate) => {
        const candidateCategoryIds =
          new Set<string>(
            [
              candidate.primaryCategoryId,
              ...candidate.categories.map(
                (item) => item.categoryId,
              ),
            ].filter(
              (value): value is string =>
                Boolean(value),
            ),
          );

        let sharedCategoryCount = 0;

        currentCategoryIds.forEach(
          (categoryId) => {
            if (
              candidateCategoryIds.has(
                categoryId,
              )
            ) {
              sharedCategoryCount += 1;
            }
          },
        );

        const sameProvince =
          candidate.provinceId ===
          currentDestination.provinceId;

        const sameRegion =
          candidate.province.regionId ===
          currentDestination.province.regionId;

        /*
         * Điểm liên quan:
         * - cùng tỉnh/thành: ưu tiên cao nhất
         * - cùng vùng miền
         * - cùng danh mục
         * - nổi bật, có ảnh, có lượt xem:
         *   dùng làm tiêu chí phụ khi bằng điểm
         */
        const relationScore =
          (sameProvince ? 100 : 0) +
          (sameRegion ? 50 : 0) +
          sharedCategoryCount * 25;

        const rankingScore =
          relationScore +
          (candidate.isFeatured ? 12 : 0) +
          (candidate.images.length > 0
            ? 6
            : 0) +
          Math.min(
            candidate._count.views,
            20,
          );

        let relationshipLabel =
          'Cùng danh mục';

        if (sameProvince) {
          relationshipLabel =
            `Cùng tỉnh/thành ${candidate.province.name}`;
        } else if (sameRegion) {
          relationshipLabel =
            `Cùng khu vực ${candidate.province.region.name}`;
        } else if (
          sharedCategoryCount > 0
        ) {
          relationshipLabel =
            'Cùng loại hình du lịch';
        }

        return {
          candidate,
          sameProvince,
          sameRegion,
          sharedCategoryCount,
          relationScore,
          rankingScore,
          relationshipLabel,
        };
      });

    const relatedEntries =
      scoredCandidates
        .filter(
          (entry) =>
            entry.relationScore > 0,
        )
        .sort((first, second) => {
          if (
            second.rankingScore !==
            first.rankingScore
          ) {
            return (
              second.rankingScore -
              first.rankingScore
            );
          }

          if (
            Number(
              second.candidate.isFeatured,
            ) !==
            Number(
              first.candidate.isFeatured,
            )
          ) {
            return (
              Number(
                second.candidate.isFeatured,
              ) -
              Number(
                first.candidate.isFeatured,
              )
            );
          }

          if (
            second.candidate._count.views !==
            first.candidate._count.views
          ) {
            return (
              second.candidate._count.views -
              first.candidate._count.views
            );
          }

          return first.candidate.name.localeCompare(
            second.candidate.name,
            'vi',
          );
        })
        .slice(0, 4);

    const relatedIds =
      new Set(
        relatedEntries.map(
          (entry) => entry.candidate.id,
        ),
      );

    const featuredElsewhereEntries =
      scoredCandidates
        .filter(
          (entry) =>
            entry.candidate.provinceId !==
              currentDestination.provinceId &&
            !relatedIds.has(
              entry.candidate.id,
            ),
        )
        .sort((first, second) => {
          if (
            Number(
              second.candidate.isFeatured,
            ) !==
            Number(
              first.candidate.isFeatured,
            )
          ) {
            return (
              Number(
                second.candidate.isFeatured,
              ) -
              Number(
                first.candidate.isFeatured,
              )
            );
          }

          /*
           * Khi mức nổi bật bằng nhau,
           * ưu tiên điểm đến ở vùng miền khác
           * để phần cuối trang đa dạng hơn.
           */
          const firstDifferentRegion =
            first.candidate.province.regionId !==
            currentDestination.province.regionId;

          const secondDifferentRegion =
            second.candidate.province.regionId !==
            currentDestination.province.regionId;

          if (
            Number(secondDifferentRegion) !==
            Number(firstDifferentRegion)
          ) {
            return (
              Number(secondDifferentRegion) -
              Number(firstDifferentRegion)
            );
          }

          if (
            second.candidate._count.views !==
            first.candidate._count.views
          ) {
            return (
              second.candidate._count.views -
              first.candidate._count.views
            );
          }

          if (
            Number(
              second.candidate.images.length >
                0,
            ) !==
            Number(
              first.candidate.images.length >
                0,
            )
          ) {
            return (
              Number(
                second.candidate.images.length >
                  0,
              ) -
              Number(
                first.candidate.images.length >
                  0,
              )
            );
          }

          return first.candidate.name.localeCompare(
            second.candidate.name,
            'vi',
          );
        })
        .slice(0, 6);

    const mapRecommendation = (
      entry:
        (typeof scoredCandidates)[number],
      recommendationType:
        | 'related'
        | 'featuredElsewhere',
    ) => {
      const candidate = entry.candidate;

      return {
        id: candidate.slug,
        databaseId: candidate.id,
        slug: candidate.slug,
        name: candidate.name,
        shortDescription:
          candidate.shortDescription,

        province: candidate.province.name,
        region:
          candidate.province.region.name,

        type:
          candidate.primaryCategory?.name ??
          null,

        categories: candidate.categories
          .map(
            (item) => item.category.name,
          )
          .sort(
            (
              firstName,
              secondName,
            ) =>
              firstName.localeCompare(
                secondName,
                'vi',
              ),
          ),

        time: candidate.bestTravelTime,

        images: candidate.images.map(
          (image) => image.url,
        ),

        isFeatured:
          candidate.isFeatured,

        viewCount:
          candidate._count.views,

        recommendationType,

        relationshipLabel:
          recommendationType ===
          'related'
            ? entry.relationshipLabel
            : candidate.isFeatured
              ? 'Điểm đến nổi bật'
              : 'Gợi ý khám phá nơi khác',
      };
    };

    return {
      current: {
        slug: normalizedSlug,
        province:
          currentDestination.province.name,
        region:
          currentDestination.province.region
            .name,
      },

      related: relatedEntries.map(
        (entry) =>
          mapRecommendation(
            entry,
            'related',
          ),
      ),

      featuredElsewhere:
        featuredElsewhereEntries.map(
          (entry) =>
            mapRecommendation(
              entry,
              'featuredElsewhere',
            ),
        ),
    };
  }

  /**
   * Lấy toàn bộ nội dung chi tiết theo slug.
   */
  async findOneBySlug(slug: string) {
    const normalizedSlug = slug
      .trim()
      .toLowerCase();

    const destination =
      await this.prisma.destination.findFirst({
        where: {
          slug: normalizedSlug,
          status: DestinationStatus.PUBLISHED,
          deletedAt: null,
        },

        select: {
          id: true,
          slug: true,
          name: true,
          shortDescription: true,
          description: true,
          bestTravelTime: true,
          mapQuery: true,

          province: {
            select: {
              name: true,

              region: {
                select: {
                  name: true,
                },
              },
            },
          },

          primaryCategory: {
            select: {
              name: true,
            },
          },

          categories: {
            select: {
              category: {
                select: {
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

            select: {
              url: true,
              altText: true,
              imageType: true,
              sourceUrl: true,
              imageCredit: true,
            },
          },

          features: {
            orderBy: {
              sortOrder: 'asc',
            },

            select: {
              title: true,
              content: true,
              icon: true,
            },
          },

          attractions: {
            where: {
              isActive: true,
            },

            orderBy: {
              sortOrder: 'asc',
            },

            select: {
              name: true,
              description: true,
              address: true,
              mapQuery: true,
              imageUrl: true,
              imageAlt: true,
              sourceUrl: true,
              imageCredit: true,
            },
          },

          foods: {
            where: {
              isActive: true,
            },

            orderBy: {
              sortOrder: 'asc',
            },

            select: {
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
            },
          },
        },
      });

    if (!destination) {
      throw new NotFoundException(
        `Không tìm thấy địa điểm có slug "${normalizedSlug}".`,
      );
    }

    return {
      id: destination.slug,
      databaseId: destination.id,
      slug: destination.slug,
      name: destination.name,

      province: destination.province.name,
      region: destination.province.region.name,

      type:
        destination.primaryCategory?.name ?? null,

      categories: destination.categories
        .map((item) => item.category.name)
        .sort((firstName, secondName) =>
          firstName.localeCompare(
            secondName,
            'vi',
          ),
        ),

      time: destination.bestTravelTime,

      images: destination.images.map(
        (image) => image.url,
      ),

      imageDetails: destination.images.map(
        (image) => ({
          url: image.url,
          altText: image.altText,
          type: image.imageType,
          sourceUrl: image.sourceUrl,
          imageCredit: image.imageCredit,
        }),
      ),

      shortDescription:
        destination.shortDescription,

      description: destination.description,

      mapQuery: destination.mapQuery,

      features: destination.features.map(
        (feature) => ({
          title: feature.title,

          // Giữ tên text tương thích dữ liệu cũ.
          text: feature.content,

          icon: feature.icon,
        }),
      ),

      highlights: destination.attractions.map(
        (attraction) => ({
          name: attraction.name,
          description: attraction.description,
          address: attraction.address,
          mapQuery: attraction.mapQuery,

          // Giữ tên image tương thích dữ liệu cũ.
          image: attraction.imageUrl,

          imageAlt: attraction.imageAlt,
          sourceUrl: attraction.sourceUrl,
          imageCredit: attraction.imageCredit,
        }),
      ),

      foods: destination.foods.map((food) => ({
        name: food.name,
        description: food.description,

        // Giữ tên image tương thích dữ liệu cũ.
        image: food.imageUrl,

        imageAlt: food.imageAlt,

        priceMin: food.priceMin,
        priceMax: food.priceMax,

        // Giữ tên priceRange tương thích dữ liệu cũ.
        priceRange: food.priceNote,

        suggestedArea: food.suggestedArea,
        sourceUrl: food.sourceUrl,
        imageCredit: food.imageCredit,
      })),
    };
  }
}