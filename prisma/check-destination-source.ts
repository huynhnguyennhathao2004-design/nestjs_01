import { loadDestinationSources } from './destination-source';

function main(): void {
  const destinations = loadDestinationSources();

  const regionNames = new Set(
    destinations.map((destination) => destination.regionName),
  );

  const provinceNames = new Set(
    destinations.map((destination) => destination.provinceName),
  );

  const categoryNames = new Set(
    destinations.flatMap(
      (destination) => destination.categoryNames,
    ),
  );

  const imageCount = destinations.reduce(
    (total, destination) => total + destination.images.length,
    0,
  );

  const featureCount = destinations.reduce(
    (total, destination) => total + destination.features.length,
    0,
  );

  const attractionCount = destinations.reduce(
    (total, destination) => total + destination.attractions.length,
    0,
  );

  const foodCount = destinations.reduce(
    (total, destination) => total + destination.foods.length,
    0,
  );

  console.log('==========================================');
  console.log('[CHECK] DỮ LIỆU ĐỊA ĐIỂM');
  console.log('==========================================');
  console.log(`[CHECK] Địa điểm: ${destinations.length}`);
  console.log(`[CHECK] Vùng miền: ${regionNames.size}`);
  console.log(`[CHECK] Tỉnh/thành: ${provinceNames.size}`);
  console.log(`[CHECK] Danh mục được sử dụng: ${categoryNames.size}`);
  console.log(`[CHECK] Ảnh địa điểm: ${imageCount}`);
  console.log(`[CHECK] Đặc điểm nổi bật: ${featureCount}`);
  console.log(`[CHECK] Điểm khám phá: ${attractionCount}`);
  console.log(`[CHECK] Món ăn: ${foodCount}`);

  console.log('\n[CHECK] Danh sách địa điểm:');

  for (const destination of destinations) {
    console.log(
      `- ${destination.slug} | ${destination.name}` +
        ` | ${destination.provinceName}` +
        ` | ${destination.primaryCategoryName}`,
    );
  }

  console.log('\n[CHECK] Danh mục:');
  console.log([...categoryNames].sort().join(', '));
}

main();