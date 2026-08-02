import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script } from 'node:vm';

export type DestinationFeatureSource = {
  title: string;
  content: string;
};

export type DestinationAttractionSource = {
  name: string;
  description?: string;
  address?: string;
  mapQuery?: string;
  imageUrl?: string;
  sourceUrl?: string;
  imageCredit?: string;
};

export type DestinationFoodSource = {
  name: string;
  description?: string;
  imageUrl?: string;
  priceMin?: number;
  priceMax?: number;
  priceNote?: string;
  suggestedArea?: string;
  sourceUrl?: string;
  imageCredit?: string;
};

export type DestinationImportSource = {
  slug: string;
  name: string;
  provinceName: string;
  regionName: string;
  primaryCategoryName: string;
  categoryNames: string[];
  bestTravelTime?: string;
  images: string[];
  shortDescription?: string;
  description: string;
  features: DestinationFeatureSource[];
  attractions: DestinationAttractionSource[];
  foods: DestinationFoodSource[];
};

type UnknownRecord = Record<string, unknown>;

const PROVINCE_NAME_ALIASES: Record<string, string> = {
  'Khánh Hoà': 'Khánh Hòa',
  'Đắk LắK': 'Đắk Lắk',
  'TP. Hồ Chí Minh': 'Thành phố Hồ Chí Minh',
};

const PRIMARY_CATEGORY_ALIASES: Record<string, string> = {
  'Văn hóa': 'Văn hóa - Lịch sử',
  'Núi rừng': 'Thiên nhiên',
};

function asRecord(value: unknown, context: string): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} phải là một object.`);
  }

  return value as UnknownRecord;
}

function requiredString(
  record: UnknownRecord,
  key: string,
  context: string,
): string {
  const value = record[key];

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${context}.${key} phải là chuỗi không rỗng.`);
  }

  return value.trim();
}

function optionalString(
  record: UnknownRecord,
  key: string,
): string | undefined {
  const value = record[key];

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function requiredArray(
  record: UnknownRecord,
  key: string,
  context: string,
): unknown[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw new Error(`${context}.${key} phải là một mảng.`);
  }

  return value;
}

function requiredStringArray(
  record: UnknownRecord,
  key: string,
  context: string,
): string[] {
  return requiredArray(record, key, context).map((item, index) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error(
        `${context}.${key}[${index}] phải là chuỗi không rỗng.`,
      );
    }

    return item.trim();
  });
}

function parsePriceRange(priceRange?: string): {
  priceMin?: number;
  priceMax?: number;
  priceNote?: string;
} {
  if (!priceRange) {
    return {};
  }

  const numberTexts = priceRange.match(/\d[\d.]*/g) ?? [];

  const numbers = numberTexts
    .map((numberText) => Number(numberText.replaceAll('.', '')))
    .filter((value) => Number.isFinite(value));

  return {
    priceMin: numbers[0],
    priceMax: numbers[1],
    priceNote: priceRange,
  };
}

function normalizeProvinceName(provinceName: string): string {
  return PROVINCE_NAME_ALIASES[provinceName] ?? provinceName;
}

function normalizePrimaryCategory(categoryName: string): string {
  return PRIMARY_CATEGORY_ALIASES[categoryName] ?? categoryName;
}

export function loadDestinationSources(): DestinationImportSource[] {
  const sourcePath = resolve(
    process.cwd(),
    'public',
    'js',
    'destinations-data.js',
  );

  const sourceCode = readFileSync(sourcePath, 'utf8');

  const sandbox: {
    window: {
      destinations?: unknown;
    };
  } = {
    window: {},
  };

  const script = new Script(sourceCode, {
    filename: sourcePath,
  });

  script.runInNewContext(sandbox, {
    timeout: 2000,
  });

  const sourceDestinations = sandbox.window.destinations;

  if (!Array.isArray(sourceDestinations)) {
    throw new Error(
      'Không đọc được window.destinations từ destinations-data.js.',
    );
  }

  return sourceDestinations.map((item, destinationIndex) => {
    const context = `destinations[${destinationIndex}]`;
    const destination = asRecord(item, context);

    const rawProvinceName = requiredString(
      destination,
      'province',
      context,
    );

    const rawPrimaryCategory = requiredString(
      destination,
      'type',
      context,
    );

    const features = requiredArray(
      destination,
      'features',
      context,
    ).map((item, featureIndex) => {
      const featureContext = `${context}.features[${featureIndex}]`;
      const feature = asRecord(item, featureContext);

      return {
        title: requiredString(feature, 'title', featureContext),
        content: requiredString(feature, 'text', featureContext),
      };
    });

    const attractions = requiredArray(
      destination,
      'highlights',
      context,
    ).map((item, attractionIndex) => {
      const attractionContext =
        `${context}.highlights[${attractionIndex}]`;

      const attraction = asRecord(item, attractionContext);

      return {
        name: requiredString(attraction, 'name', attractionContext),
        description: optionalString(attraction, 'description'),
        address: optionalString(attraction, 'address'),
        mapQuery: optionalString(attraction, 'mapQuery'),
        imageUrl: optionalString(attraction, 'image'),
        sourceUrl: optionalString(attraction, 'sourceUrl'),
        imageCredit: optionalString(attraction, 'imageCredit'),
      };
    });

    const foods = requiredArray(
      destination,
      'foods',
      context,
    ).map((item, foodIndex) => {
      const foodContext = `${context}.foods[${foodIndex}]`;
      const food = asRecord(item, foodContext);

      const priceRange = optionalString(food, 'priceRange');
      const parsedPrice = parsePriceRange(priceRange);

      return {
        name: requiredString(food, 'name', foodContext),
        description: optionalString(food, 'description'),
        imageUrl: optionalString(food, 'image'),
        suggestedArea: optionalString(food, 'suggestedArea'),
        sourceUrl: optionalString(food, 'sourceUrl'),
        imageCredit: optionalString(food, 'imageCredit'),
        ...parsedPrice,
      };
    });

    return {
      slug: requiredString(destination, 'id', context),
      name: requiredString(destination, 'name', context),

      provinceName: normalizeProvinceName(rawProvinceName),

      regionName: requiredString(destination, 'region', context),

      primaryCategoryName:
        normalizePrimaryCategory(rawPrimaryCategory),

      categoryNames: requiredStringArray(
        destination,
        'categories',
        context,
      ),

      bestTravelTime: optionalString(destination, 'time'),

      images: requiredStringArray(
        destination,
        'images',
        context,
      ),

      shortDescription: optionalString(
        destination,
        'shortDescription',
      ),

      description: requiredString(
        destination,
        'description',
        context,
      ),

      features,
      attractions,
      foods,
    };
  });
}