import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

import { loadDestinationSources } from './destination-source';

import {
  AuthProvider,
  DestinationImageType,
  DestinationStatus,
  UserRole,
  UserStatus,
} from '../src/generated/prisma/enums';

type RegionSeed = {
  name: string;
  slug: string;
  sortOrder: number;
};

type ProvinceSeed = {
  name: string;
  slug: string;
  regionSlug: string;
};

type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  icon: string;
};

const connectionString = process.env.DIRECT_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DIRECT_DATABASE_URL chưa được cấu hình trong file .env.',
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const regions: RegionSeed[] = [
  { name: 'Miền Bắc', slug: 'mien-bac', sortOrder: 1 },
  { name: 'Miền Trung', slug: 'mien-trung', sortOrder: 2 },
  { name: 'Tây Nguyên', slug: 'tay-nguyen', sortOrder: 3 },
  { name: 'Miền Nam', slug: 'mien-nam', sortOrder: 4 },
];

// Danh sách 34 đơn vị hành chính cấp tỉnh hiện hành.
// regionSlug là cách nhóm phục vụ bộ lọc du lịch của website, không phải phân vùng hành chính chính thức.
const provinces: ProvinceSeed[] = [
  // Miền Bắc
  { name: 'Hà Nội', slug: 'ha-noi', regionSlug: 'mien-bac' },
  { name: 'Hải Phòng', slug: 'hai-phong', regionSlug: 'mien-bac' },
  { name: 'Quảng Ninh', slug: 'quang-ninh', regionSlug: 'mien-bac' },
  { name: 'Cao Bằng', slug: 'cao-bang', regionSlug: 'mien-bac' },
  { name: 'Lạng Sơn', slug: 'lang-son', regionSlug: 'mien-bac' },
  { name: 'Bắc Ninh', slug: 'bac-ninh', regionSlug: 'mien-bac' },
  { name: 'Hưng Yên', slug: 'hung-yen', regionSlug: 'mien-bac' },
  { name: 'Ninh Bình', slug: 'ninh-binh', regionSlug: 'mien-bac' },
  { name: 'Phú Thọ', slug: 'phu-tho', regionSlug: 'mien-bac' },
  { name: 'Thái Nguyên', slug: 'thai-nguyen', regionSlug: 'mien-bac' },
  { name: 'Tuyên Quang', slug: 'tuyen-quang', regionSlug: 'mien-bac' },
  { name: 'Lào Cai', slug: 'lao-cai', regionSlug: 'mien-bac' },
  { name: 'Lai Châu', slug: 'lai-chau', regionSlug: 'mien-bac' },
  { name: 'Điện Biên', slug: 'dien-bien', regionSlug: 'mien-bac' },
  { name: 'Sơn La', slug: 'son-la', regionSlug: 'mien-bac' },

  // Miền Trung
  { name: 'Thanh Hóa', slug: 'thanh-hoa', regionSlug: 'mien-trung' },
  { name: 'Nghệ An', slug: 'nghe-an', regionSlug: 'mien-trung' },
  { name: 'Hà Tĩnh', slug: 'ha-tinh', regionSlug: 'mien-trung' },
  { name: 'Quảng Trị', slug: 'quang-tri', regionSlug: 'mien-trung' },
  { name: 'Huế', slug: 'hue', regionSlug: 'mien-trung' },
  { name: 'Đà Nẵng', slug: 'da-nang', regionSlug: 'mien-trung' },
  { name: 'Quảng Ngãi', slug: 'quang-ngai', regionSlug: 'mien-trung' },
  { name: 'Khánh Hòa', slug: 'khanh-hoa', regionSlug: 'mien-trung' },

  // Tây Nguyên — nhóm phục vụ bộ lọc du lịch của website.
  { name: 'Gia Lai', slug: 'gia-lai', regionSlug: 'tay-nguyen' },
  { name: 'Đắk Lắk', slug: 'dak-lak', regionSlug: 'tay-nguyen' },
  { name: 'Lâm Đồng', slug: 'lam-dong', regionSlug: 'tay-nguyen' },

  // Miền Nam
  {
    name: 'Thành phố Hồ Chí Minh',
    slug: 'thanh-pho-ho-chi-minh',
    regionSlug: 'mien-nam',
  },
  { name: 'Đồng Nai', slug: 'dong-nai', regionSlug: 'mien-nam' },
  { name: 'Tây Ninh', slug: 'tay-ninh', regionSlug: 'mien-nam' },
  { name: 'Cần Thơ', slug: 'can-tho', regionSlug: 'mien-nam' },
  { name: 'Vĩnh Long', slug: 'vinh-long', regionSlug: 'mien-nam' },
  { name: 'Đồng Tháp', slug: 'dong-thap', regionSlug: 'mien-nam' },
  { name: 'Cà Mau', slug: 'ca-mau', regionSlug: 'mien-nam' },
  { name: 'An Giang', slug: 'an-giang', regionSlug: 'mien-nam' },
];

const categories: CategorySeed[] = [
  {
    name: 'Thiên nhiên',
    slug: 'thien-nhien',
    description: 'Núi, rừng, hồ, thác và cảnh quan thiên nhiên.',
    icon: 'mountain',
  },
  {
    name: 'Biển đảo',
    slug: 'bien-dao',
    description: 'Bãi biển, đảo, vịnh và hoạt động du lịch ven biển.',
    icon: 'waves',
  },
  {
    name: 'Nghỉ dưỡng',
    slug: 'nghi-duong',
    description: 'Địa điểm phù hợp thư giãn, nghỉ dưỡng và phục hồi sức khỏe.',
    icon: 'hotel',
  },
  {
    name: 'Văn hóa - Lịch sử',
    slug: 'van-hoa-lich-su',
    description: 'Di tích, bảo tàng, kiến trúc và giá trị văn hóa lịch sử.',
    icon: 'landmark',
  },
  {
    name: 'Ẩm thực',
    slug: 'am-thuc',
    description: 'Điểm đến nổi bật về món ăn và trải nghiệm ẩm thực địa phương.',
    icon: 'utensils',
  },
  {
    name: 'Di sản',
    slug: 'di-san',
    description: 'Di sản văn hóa, thiên nhiên và các giá trị được bảo tồn.',
    icon: 'gem',
  },
  {
    name: 'Khám phá',
    slug: 'kham-pha',
    description: 'Trải nghiệm, phiêu lưu và khám phá điểm đến mới.',
    icon: 'compass',
  },
  {
    name: 'Sinh thái',
    slug: 'sinh-thai',
    description: 'Du lịch xanh, cộng đồng và trải nghiệm hệ sinh thái.',
    icon: 'leaf',
  },
{
  name: 'Tâm linh',
  slug: 'tam-linh',
  description: 'Đền, chùa, nhà thờ và các địa điểm tín ngưỡng.',
  icon: 'church',
},
{
  name: 'Đô thị',
  slug: 'do-thi',
  description: 'Thành phố, kiến trúc hiện đại và trải nghiệm đô thị.',
  icon: 'building-2',
},
];

function requireAdminEnvironment(): {
  email: string;
  password: string;
  fullName: string;
} {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_FULL_NAME?.trim();

  if (!email || !email.includes('@')) {
    throw new Error('SEED_ADMIN_EMAIL chưa hợp lệ trong file .env.');
  }

  if (!password || password.length < 12) {
    throw new Error(
      'SEED_ADMIN_PASSWORD phải có ít nhất 12 ký tự trong file .env.',
    );
  }

  if (!fullName) {
    throw new Error('SEED_ADMIN_FULL_NAME chưa được cấu hình trong file .env.');
  }

  return { email, password, fullName };
}

async function seedRegionsAndProvinces(): Promise<void> {
  const regionIdBySlug = new Map<string, string>();

  for (const region of regions) {
    const savedRegion = await prisma.region.upsert({
      where: { slug: region.slug },
      update: {
        name: region.name,
        sortOrder: region.sortOrder,
      },
      create: region,
    });

    regionIdBySlug.set(savedRegion.slug, savedRegion.id);
  }

  for (const province of provinces) {
    const regionId = regionIdBySlug.get(province.regionSlug);

    if (!regionId) {
      throw new Error(`Không tìm thấy vùng có slug: ${province.regionSlug}`);
    }

    await prisma.province.upsert({
      where: { slug: province.slug },
      update: {
        name: province.name,
        regionId,
      },
      create: {
        name: province.name,
        slug: province.slug,
        regionId,
      },
    });
  }
}

async function seedCategories(): Promise<void> {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        isActive: true,
      },
      create: {
        ...category,
        isActive: true,
      },
    });
  }
}

async function seedDestinations(): Promise<void> {
  const destinationSources = loadDestinationSources();

  console.log(
    `[SEED] Chuẩn bị nhập ${destinationSources.length} địa điểm...`,
  );

  for (const source of destinationSources) {
    await prisma.$transaction(
      async (tx) => {
        /*
         * 1. Tìm tỉnh/thành theo cả tên tỉnh và tên vùng.
         *
         * Việc kiểm tra tên vùng giúp tránh gán địa điểm nhầm tỉnh
         * trong trường hợp dữ liệu có tên gần giống nhau.
         */
        const province = await tx.province.findFirst({
          where: {
            name: source.provinceName,
            region: {
              is: {
                name: source.regionName,
              },
            },
          },
          select: {
            id: true,
            name: true,
            region: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!province) {
          throw new Error(
            `Không tìm thấy tỉnh "${source.provinceName}" ` +
              `thuộc vùng "${source.regionName}" ` +
              `cho địa điểm "${source.name}".`,
          );
        }

        /*
         * 2. Lấy danh mục chính và toàn bộ danh mục phụ.
         *
         * Dùng Set để tránh danh mục bị lặp.
         */
        const requiredCategoryNames = [
          ...new Set([
            source.primaryCategoryName,
            ...source.categoryNames,
          ]),
        ];

        const categoryRecords = await tx.category.findMany({
          where: {
            name: {
              in: requiredCategoryNames,
            },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
          },
        });

        const categoryIdByName = new Map(
          categoryRecords.map((category) => [
            category.name,
            category.id,
          ]),
        );

        const missingCategoryNames =
          requiredCategoryNames.filter(
            (categoryName) =>
              !categoryIdByName.has(categoryName),
          );

        if (missingCategoryNames.length > 0) {
          throw new Error(
            `Địa điểm "${source.name}" đang dùng danh mục chưa tồn tại: ` +
              missingCategoryNames.join(', '),
          );
        }

        const primaryCategoryId = categoryIdByName.get(
          source.primaryCategoryName,
        );

        if (!primaryCategoryId) {
          throw new Error(
            `Không tìm thấy danh mục chính ` +
              `"${source.primaryCategoryName}" ` +
              `của địa điểm "${source.name}".`,
          );
        }

        /*
         * 3. Tạo mới hoặc cập nhật thông tin chính của địa điểm.
         */
        const savedDestination =
          await tx.destination.upsert({
            where: {
              slug: source.slug,
            },

            update: {
              provinceId: province.id,
              primaryCategoryId,
              name: source.name,
              shortDescription:
                source.shortDescription ?? null,
              description: source.description,
              bestTravelTime:
                source.bestTravelTime ?? null,
              status: DestinationStatus.PUBLISHED,
              metaTitle: source.name,
              metaDescription:
                source.shortDescription ?? null,
              deletedAt: null,
            },

            create: {
              provinceId: province.id,
              primaryCategoryId,
              slug: source.slug,
              name: source.name,
              shortDescription:
                source.shortDescription ?? null,
              description: source.description,
              bestTravelTime:
                source.bestTravelTime ?? null,
              status: DestinationStatus.PUBLISHED,
              metaTitle: source.name,
              metaDescription:
                source.shortDescription ?? null,
              publishedAt: new Date(),
            },
          });

        /*
         * Trường hợp địa điểm đã tồn tại nhưng chưa có ngày đăng.
         */
        if (!savedDestination.publishedAt) {
          await tx.destination.update({
            where: {
              id: savedDestination.id,
            },
            data: {
              publishedAt: new Date(),
            },
          });
        }

        /*
         * 4. Xóa dữ liệu con cũ của đúng địa điểm này.
         *
         * Việc này giúp chạy seed nhiều lần mà không tạo dữ liệu trùng.
         */
        await tx.destinationCategory.deleteMany({
          where: {
            destinationId: savedDestination.id,
          },
        });

        await tx.destinationImage.deleteMany({
          where: {
            destinationId: savedDestination.id,
          },
        });

        await tx.destinationFeature.deleteMany({
          where: {
            destinationId: savedDestination.id,
          },
        });

        await tx.destinationAttraction.deleteMany({
          where: {
            destinationId: savedDestination.id,
          },
        });

        await tx.destinationFood.deleteMany({
          where: {
            destinationId: savedDestination.id,
          },
        });

        /*
         * 5. Tạo liên kết địa điểm và danh mục.
         */
        await tx.destinationCategory.createMany({
          data: requiredCategoryNames.map(
            (categoryName) => ({
              destinationId: savedDestination.id,
              categoryId:
                categoryIdByName.get(categoryName)!,
            }),
          ),
        });

        /*
         * 6. Tạo ảnh.
         *
         * Ảnh đầu tiên được dùng làm ảnh COVER.
         * Các ảnh còn lại là ảnh GALLERY.
         */
        if (source.images.length > 0) {
          await tx.destinationImage.createMany({
            data: source.images.map(
              (imageUrl, index) => ({
                destinationId: savedDestination.id,
                url: imageUrl,
                altText:
                  index === 0
                    ? `${source.name} - ảnh đại diện`
                    : `${source.name} - ảnh ${index + 1}`,
                imageType:
                  index === 0
                    ? DestinationImageType.COVER
                    : DestinationImageType.GALLERY,
                sortOrder: index,
                isActive: true,
              }),
            ),
          });
        }

        /*
         * 7. Tạo các đặc điểm nổi bật.
         */
        if (source.features.length > 0) {
          await tx.destinationFeature.createMany({
            data: source.features.map(
              (feature, index) => ({
                destinationId: savedDestination.id,
                title: feature.title,
                content: feature.content,
                sortOrder: index,
              }),
            ),
          });
        }

        /*
         * 8. Tạo các điểm nên khám phá.
         */
        if (source.attractions.length > 0) {
          await tx.destinationAttraction.createMany({
            data: source.attractions.map(
              (attraction, index) => ({
                destinationId: savedDestination.id,
                name: attraction.name,
                description:
                  attraction.description ?? null,
                address: attraction.address ?? null,
                mapQuery: attraction.mapQuery ?? null,
                imageUrl: attraction.imageUrl ?? null,
                imageAlt: attraction.imageUrl
                  ? `${attraction.name} tại ${source.name}`
                  : null,
                sourceUrl:
                  attraction.sourceUrl ?? null,
                imageCredit:
                  attraction.imageCredit ?? null,
                sortOrder: index,
                isActive: true,
              }),
            ),
          });
        }

        /*
         * 9. Tạo các món ăn gợi ý.
         */
        if (source.foods.length > 0) {
          await tx.destinationFood.createMany({
            data: source.foods.map(
              (food, index) => ({
                destinationId: savedDestination.id,
                name: food.name,
                description:
                  food.description ?? null,
                imageUrl: food.imageUrl ?? null,
                imageAlt: food.imageUrl
                  ? `${food.name} tại ${source.name}`
                  : null,
                priceMin: food.priceMin ?? null,
                priceMax: food.priceMax ?? null,
                priceNote: food.priceNote ?? null,
                suggestedArea:
                  food.suggestedArea ?? null,
                sourceUrl: food.sourceUrl ?? null,
                imageCredit:
                  food.imageCredit ?? null,
                sortOrder: index,
                isActive: true,
              }),
            ),
          });
        }
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );

    console.log(
      `[SEED] Đã nhập: ${source.name} (${source.slug})`,
    );
  }
}

async function seedAdmin(): Promise<void> {
  const { email, password, fullName } = requireAdminEnvironment();
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      deletedAt: null,
    },
    create: {
      email,
      fullName,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.authAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: AuthProvider.LOCAL,
        providerAccountId: email,
      },
    },
    update: {
      userId: admin.id,
    },
    create: {
      userId: admin.id,
      provider: AuthProvider.LOCAL,
      providerAccountId: email,
    },
  });
}

async function main(): Promise<void> {
  console.log('[SEED] Bắt đầu tạo dữ liệu nền...');

await seedRegionsAndProvinces();
await seedCategories();
await seedDestinations();
await seedAdmin();

const [
  regionCount,
  provinceCount,
  categoryCount,
  destinationCount,
  destinationCategoryCount,
  destinationImageCount,
  destinationFeatureCount,
  destinationAttractionCount,
  destinationFoodCount,
  adminCount,
] = await Promise.all([
  prisma.region.count(),
  prisma.province.count(),
  prisma.category.count(),

  prisma.destination.count({
    where: {
      deletedAt: null,
    },
  }),

  prisma.destinationCategory.count(),
  prisma.destinationImage.count(),
  prisma.destinationFeature.count(),
  prisma.destinationAttraction.count(),
  prisma.destinationFood.count(),

  prisma.user.count({
    where: {
      role: UserRole.ADMIN,
    },
  }),
]);

console.log('==========================================');
console.log(`[SEED] Vùng miền: ${regionCount}`);
console.log(`[SEED] Tỉnh/thành: ${provinceCount}`);
console.log(`[SEED] Danh mục: ${categoryCount}`);
console.log(`[SEED] Địa điểm: ${destinationCount}`);
console.log(
  `[SEED] Liên kết danh mục: ${destinationCategoryCount}`,
);
console.log(
  `[SEED] Ảnh địa điểm: ${destinationImageCount}`,
);
console.log(
  `[SEED] Đặc điểm nổi bật: ${destinationFeatureCount}`,
);
console.log(
  `[SEED] Điểm khám phá: ${destinationAttractionCount}`,
);
console.log(
  `[SEED] Món ăn: ${destinationFoodCount}`,
);
console.log(`[SEED] Tài khoản Admin: ${adminCount}`);
console.log('==========================================');
console.log('[SEED] Hoàn thành.');
}

main()
  .catch((error: unknown) => {
    console.error('[SEED] Thất bại:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });