import { TextNormalizerService } from './text-normalizer.service';

const normalizer = new TextNormalizerService();

const samples = [
  'Đà Lạt cách TP.HCM khoảng 300 km.',
  'Nhiệt độ từ 18-25°C, độ ẩm 82,5%.',
  'Giá vé 150.000đ/người, trẻ dưới 6 tuổi miễn phí.',
  'Mở cửa 07:30-17:00 ngày 31/07/2026.',
  'Hotline: 0901 234 567.',
  'Mã đặt chỗ VN2026A, phòng 305.',
  'Tọa độ 10.7626°N và 106.6601°E.',
  'Video 1920x1080 px, dung lượng 1,5 GB.',
  'Phiên bản v1.2.3 chạy tại 192.168.1.10:3000.',
  'Tỷ lệ 16:9, kết quả 2-1.',
  'Khoảng 1 1/2 giờ, tương đương 90 phút.',
  'Giá trị 1.2e-3 và 10^6.',
  'Thế kỷ XXI, giai đoạn 2020-2026.',
];

for (const sample of samples) {
  console.log('\nGỐC :', sample);
  console.log('ĐỌC :', normalizer.normalize(sample));
}
