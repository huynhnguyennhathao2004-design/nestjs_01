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

            orderBy: {
              sortOrder: 'asc',
            },

            select: {
              url: true,
            },
          },
        },
      });

    return destinations.map((destination) => ({
      /*
       * Giữ trường id giống dữ liệu JavaScript cũ.
       * id ở frontend cũ thực chất chính là slug.
       */
      id: destination.slug,
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

            orderBy: {
              sortOrder: 'asc',
            },

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