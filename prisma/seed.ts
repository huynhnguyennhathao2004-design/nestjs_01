import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import {
  AuthProvider,
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
  await seedAdmin();

  const [regionCount, provinceCount, categoryCount, adminCount] =
    await Promise.all([
      prisma.region.count(),
      prisma.province.count(),
      prisma.category.count(),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
    ]);

  console.log(`[SEED] Vùng miền: ${regionCount}`);
  console.log(`[SEED] Tỉnh/thành: ${provinceCount}`);
  console.log(`[SEED] Danh mục: ${categoryCount}`);
  console.log(`[SEED] Tài khoản Admin: ${adminCount}`);
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