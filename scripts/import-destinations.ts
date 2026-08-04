import 'dotenv/config';

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import {
  DestinationImageType,
  DestinationStatus,
} from '../src/generated/prisma/enums';

type ImportFeature = {
  title: string;
  content: string;
};

type ImportAttraction = {
  name: string;
  description?: string;
  address?: string;
  mapQuery?: string;
  imageUrl?: string;
};

type ImportFood = {
  name: string;
  description?: string;
  imageUrl?: string;
  priceMin?: number;
  priceMax?: number;
  priceNote?: string;
  suggestedArea?: string;
};

type ImportDestination = {
  slug: string;
  name: string;
  provinceName: string;
  regionName: string;
  primaryCategoryName: string;
  categoryNames?: string[];

  shortDescription?: string;
  description: string;
  bestTravelTime?: string;
  mapQuery?: string;
  isFeatured?: boolean;

  images?: string[];
  features?: ImportFeature[];
  attractions?: ImportAttraction[];
  foods?: ImportFood[];
};

type ImportSummary = {
  total: number;
  inserted: number;
  skipped: number;
  available: number;
  failed: number;
};

const connectionString =
  process.env.DIRECT_DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error(
    'Thiếu DIRECT_DATABASE_URL trong file .env.',
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const isDryRun = process.argv.includes('--dry-run');

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function loadImportData(): ImportDestination[] {
  const dataFile = resolve(
    process.cwd(),
    'prisma',
    'data',
    'destinations-import.json',
  );

  if (!existsSync(dataFile)) {
    throw new Error(
      `Không tìm thấy file dữ liệu: ${dataFile}`,
    );
  }

  const rawContent = readFileSync(dataFile, 'utf8')
    .replace(/^\uFEFF/, '');

  const parsed: unknown = JSON.parse(rawContent);

  if (!Array.isArray(parsed)) {
    throw new Error(
      'destinations-import.json phải chứa một mảng JSON.',
    );
  }

  return parsed as ImportDestination[];
}

function validateDestination(
  source: ImportDestination,
): void {
  const requiredValues = [
    ['slug', source.slug],
    ['name', source.name],
    ['provinceName', source.provinceName],
    ['regionName', source.regionName],
    [
      'primaryCategoryName',
      source.primaryCategoryName,
    ],
    ['description', source.description],
  ] as const;

  for (const [fieldName, fieldValue] of requiredValues) {
    if (
      typeof fieldValue !== 'string' ||
      !fieldValue.trim()
    ) {
      throw new Error(
        `Trường "${fieldName}" đang bị thiếu hoặc rỗng.`,
      );
    }
  }

  if (
    source.shortDescription &&
    source.shortDescription.length > 500
  ) {
    throw new Error(
      'shortDescription không được vượt quá 500 ký tự.',
    );
  }

  if (
    source.bestTravelTime &&
    source.bestTravelTime.length > 255
  ) {
    throw new Error(
      'bestTravelTime không được vượt quá 255 ký tự.',
    );
  }
}

async function runImport(): Promise<void> {
  const destinations = loadImportData();

  const summary: ImportSummary = {
    total: destinations.length,
    inserted: 0,
    skipped: 0,
    available: 0,
    failed: 0,
  };

  const processedSlugs = new Set<string>();

  console.log('========================================');
  console.log(
    isDryRun
      ? '[DRY-RUN] Kiểm tra dữ liệu địa điểm'
      : '[IMPORT] Bắt đầu thêm địa điểm vào Neon',
  );
  console.log(`Tổng dữ liệu: ${summary.total}`);
  console.log('========================================');

  for (const source of destinations) {
    try {
      validateDestination(source);

      if (processedSlugs.has(source.slug)) {
        throw new Error(
          `Slug "${source.slug}" bị lặp trong file JSON.`,
        );
      }

      processedSlugs.add(source.slug);

      const existingDestination =
        await prisma.destination.findUnique({
          where: {
            slug: source.slug,
          },
          select: {
            id: true,
            name: true,
          },
        });

      if (existingDestination) {
        summary.skipped += 1;

        console.log(
          `[SKIP] Đã tồn tại: ${source.name} (${source.slug})`,
        );

        continue;
      }

      const province =
        await prisma.province.findFirst({
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
          },
        });

      if (!province) {
        throw new Error(
          `Không tìm thấy tỉnh "${source.provinceName}" ` +
            `thuộc vùng "${source.regionName}".`,
        );
      }

      const requiredCategoryNames = [
        ...new Set([
          source.primaryCategoryName,
          ...(source.categoryNames ?? []),
        ]),
      ];

      const categoryRecords =
        await prisma.category.findMany({
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

      const missingCategories =
        requiredCategoryNames.filter(
          (categoryName) =>
            !categoryIdByName.has(categoryName),
        );

      if (missingCategories.length > 0) {
        throw new Error(
          `Danh mục chưa tồn tại: ${missingCategories.join(', ')}`,
        );
      }

      const primaryCategoryId =
        categoryIdByName.get(
          source.primaryCategoryName,
        );

      if (!primaryCategoryId) {
        throw new Error(
          `Không tìm thấy danh mục chính ` +
            `"${source.primaryCategoryName}".`,
        );
      }

      if (isDryRun) {
        summary.available += 1;

        console.log(
          `[DRY-RUN] Có thể thêm: ${source.name}`,
        );

        continue;
      }

      await prisma.$transaction(
        async (tx) => {
          const savedDestination =
            await tx.destination.create({
              data: {
                provinceId: province.id,
                primaryCategoryId,
                slug: source.slug,
                name: source.name,
                shortDescription:
                  source.shortDescription ?? null,
                description: source.description,
                bestTravelTime:
                  source.bestTravelTime ?? null,
                mapQuery: source.mapQuery ?? null,
                status:
                  DestinationStatus.PUBLISHED,
                isFeatured:
                  source.isFeatured ?? false,
                metaTitle: source.name,
                metaDescription:
                  source.shortDescription ?? null,
                publishedAt: new Date(),
              },
            });

          await tx.destinationCategory.createMany({
            data: requiredCategoryNames.map(
              (categoryName) => ({
                destinationId:
                  savedDestination.id,
                categoryId:
                  categoryIdByName.get(
                    categoryName,
                  )!,
              }),
            ),
          });

          const images = source.images ?? [];

          if (images.length > 0) {
            await tx.destinationImage.createMany({
              data: images.map(
                (imageUrl, index) => ({
                  destinationId:
                    savedDestination.id,
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

          const features = source.features ?? [];

          if (features.length > 0) {
            await tx.destinationFeature.createMany({
              data: features.map(
                (feature, index) => ({
                  destinationId:
                    savedDestination.id,
                  title: feature.title,
                  content: feature.content,
                  sortOrder: index,
                }),
              ),
            });
          }

          const attractions =
            source.attractions ?? [];

          if (attractions.length > 0) {
            await tx.destinationAttraction.createMany({
              data: attractions.map(
                (attraction, index) => ({
                  destinationId:
                    savedDestination.id,
                  name: attraction.name,
                  description:
                    attraction.description ?? null,
                  address:
                    attraction.address ?? null,
                  mapQuery:
                    attraction.mapQuery ?? null,
                  imageUrl:
                    attraction.imageUrl ?? null,
                  imageAlt:
                    attraction.imageUrl
                      ? `${attraction.name} tại ${source.name}`
                      : null,
                  sortOrder: index,
                  isActive: true,
                }),
              ),
            });
          }

          const foods = source.foods ?? [];

          if (foods.length > 0) {
            await tx.destinationFood.createMany({
              data: foods.map(
                (food, index) => ({
                  destinationId:
                    savedDestination.id,
                  name: food.name,
                  description:
                    food.description ?? null,
                  imageUrl:
                    food.imageUrl ?? null,
                  imageAlt:
                    food.imageUrl
                      ? `${food.name} tại ${source.name}`
                      : null,
                  priceMin:
                    food.priceMin ?? null,
                  priceMax:
                    food.priceMax ?? null,
                  priceNote:
                    food.priceNote ?? null,
                  suggestedArea:
                    food.suggestedArea ?? null,
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

      summary.inserted += 1;

      console.log(
        `[IMPORT] Đã thêm: ${source.name} (${source.slug})`,
      );
    } catch (error: unknown) {
      summary.failed += 1;

      console.error(
        `[ERROR] ${source.name ?? 'Không rõ'}: ` +
          getErrorMessage(error),
      );
    }
  }

  console.log('');
  console.log('========================================');
  console.log('[IMPORT] KẾT QUẢ');
  console.log(`Tổng dữ liệu: ${summary.total}`);

  if (isDryRun) {
    console.log(`Có thể thêm: ${summary.available}`);
  } else {
    console.log(`Đã thêm mới: ${summary.inserted}`);
  }

  console.log(`Đã tồn tại: ${summary.skipped}`);
  console.log(`Bị lỗi: ${summary.failed}`);
  console.log('========================================');

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

runImport()
  .catch((error: unknown) => {
    console.error(
      '[IMPORT] Lỗi nghiêm trọng:',
      getErrorMessage(error),
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });