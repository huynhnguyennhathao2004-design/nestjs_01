import { Injectable } from '@nestjs/common';

export type TextNormalizerOptions = {
  /** Giữ nguyên URL và email, tránh đổi các chữ số bên trong. */
  preserveUrlsAndEmails?: boolean;
  /** Từ dùng cho hàng chục bị khuyết, ví dụ 105 = một trăm linh năm. */
  zeroTensWord?: 'linh' | 'lẻ';
};

type ParsedNumber = {
  sign: -1 | 1;
  integer: string;
  fraction: string;
};

const NUMBER_PATTERN = String.raw`[+-]?(?:\d{1,3}(?:[.,\s]\d{3})+|\d+)(?:[.,]\d+)?`;
const UNSIGNED_NUMBER_PATTERN = String.raw`(?:\d{1,3}(?:[.,\s]\d{3})+|\d+)(?:[.,]\d+)?`;

const DIGIT_WORDS = [
  'không',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
] as const;

const SCALE_WORDS = [
  '',
  'nghìn',
  'triệu',
  'tỷ',
  'nghìn tỷ',
  'triệu tỷ',
  'tỷ tỷ',
  'nghìn tỷ tỷ',
  'triệu tỷ tỷ',
] as const;

const LETTER_WORDS: Record<string, string> = {
  A: 'a',
  B: 'bê',
  C: 'xê',
  D: 'dê',
  E: 'e',
  F: 'ép',
  G: 'gờ',
  H: 'hát',
  I: 'i',
  J: 'giê',
  K: 'ca',
  L: 'e lờ',
  M: 'em',
  N: 'en',
  O: 'ô',
  P: 'pê',
  Q: 'quy',
  R: 'e rờ',
  S: 'ét',
  T: 'tê',
  U: 'u',
  V: 'vê',
  W: 'vê kép',
  X: 'ích',
  Y: 'i dài',
  Z: 'dét',
};

const UNIT_WORDS: Record<string, string> = {
  'km/h': 'ki-lô-mét trên giờ',
  'km²': 'ki-lô-mét vuông',
  'km2': 'ki-lô-mét vuông',
  'km³': 'ki-lô-mét khối',
  'km3': 'ki-lô-mét khối',
  'm/s': 'mét trên giây',
  'm²': 'mét vuông',
  'm2': 'mét vuông',
  'm³': 'mét khối',
  'm3': 'mét khối',
  'cm²': 'xen-ti-mét vuông',
  'cm2': 'xen-ti-mét vuông',
  'cm³': 'xen-ti-mét khối',
  'cm3': 'xen-ti-mét khối',
  'mm²': 'mi-li-mét vuông',
  'mm2': 'mi-li-mét vuông',
  'mm³': 'mi-li-mét khối',
  'mm3': 'mi-li-mét khối',
  GHz: 'ghi-ga-héc',
  MHz: 'mê-ga-héc',
  kHz: 'ki-lô-héc',
  Hz: 'héc',
  TB: 'tê-ra-bai',
  GB: 'ghi-ga-bai',
  MB: 'mê-ga-bai',
  KB: 'ki-lô-bai',
  Mbps: 'mê-ga-bít trên giây',
  Kbps: 'ki-lô-bít trên giây',
  Gbps: 'ghi-ga-bít trên giây',
  kWh: 'ki-lô-oát giờ',
  kW: 'ki-lô-oát',
  MW: 'mê-ga-oát',
  W: 'oát',
  kV: 'ki-lô-vôn',
  mV: 'mi-li-vôn',
  V: 'vôn',
  mA: 'mi-li-am-pe',
  A: 'am-pe',
  bpm: 'nhịp trên phút',
  fps: 'khung hình trên giây',
  dpi: 'điểm trên inch',
  px: 'pích-xen',
  ha: 'héc-ta',
  km: 'ki-lô-mét',
  cm: 'xen-ti-mét',
  mm: 'mi-li-mét',
  m: 'mét',
  kg: 'ki-lô-gam',
  mg: 'mi-li-gam',
  g: 'gam',
  ml: 'mi-li-lít',
  cl: 'xen-ti-lít',
  dl: 'đề-xi-lít',
  l: 'lít',
  ms: 'mi-li-giây',
  phút: 'phút',
  giây: 'giây',
  giờ: 'giờ',
  ngày: 'ngày',
  tuần: 'tuần',
  tháng: 'tháng',
  năm: 'năm',
  người: 'người',
  khách: 'khách',
  vé: 'vé',
  tuổi: 'tuổi',
  sao: 'sao',
  tầng: 'tầng',
  bước: 'bước',
  điểm: 'điểm',
};

const CURRENCY_WORDS: Record<string, string> = {
  '₫': 'đồng',
  đ: 'đồng',
  đồng: 'đồng',
  vnd: 'đồng',
  '$': 'đô la Mỹ',
  usd: 'đô la Mỹ',
  '€': 'ơ-rô',
  eur: 'ơ-rô',
  '£': 'bảng Anh',
  gbp: 'bảng Anh',
  '¥': 'yên Nhật',
  jpy: 'yên Nhật',
};

@Injectable()
export class TextNormalizerService {
  private readonly defaultOptions: Required<TextNormalizerOptions> = {
    preserveUrlsAndEmails: true,
    zeroTensWord: 'linh',
  };

  normalize(input: string, options: TextNormalizerOptions = {}): string {
    const config = { ...this.defaultOptions, ...options };
    let text = String(input ?? '')
      .normalize('NFC')
      .replace(/\u00a0/g, ' ')
      .replace(/[–—]/g, '–')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");

    const protectedValues: string[] = [];
    const protect = (value: string): string => {
      const marker = `__TTS_${this.numberToLetters(protectedValues.length)}__`;
      protectedValues.push(value);
      return marker;
    };

    if (config.preserveUrlsAndEmails) {
      text = text.replace(/\bhttps?:\/\/[^\s<>()]+|\bwww\.[^\s<>()]+/giu, protect);
      text = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, protect);
    }

    // Quy tắc càng đặc biệt càng phải chạy trước.
    text = this.normalizeLabeledCodes(text);
    text = this.normalizePhoneNumbers(text);
    text = this.normalizeIpv4(text);
    text = this.normalizeVersions(text);
    text = this.normalizeDates(text, config);
    text = this.normalizeYearExpressions(text, config);
    text = this.normalizeRatiosAndScores(text, config);
    text = this.normalizeTimes(text, config);
    text = this.normalizeCoordinates(text, config);
    text = this.normalizeScientificNotation(text, config);
    text = this.normalizePowers(text, config);
    text = this.normalizeTemperatures(text, config);
    text = this.normalizePercentages(text, config);
    text = this.normalizeCurrencies(text, config);
    text = this.normalizePerExpressions(text);
    text = this.normalizeFractions(text, config);
    text = this.normalizeDimensions(text, config);
    text = this.normalizeUnitValues(text, config);
    text = this.normalizeOrdinals(text, config);
    text = this.normalizeRomanNumerals(text, config);
    text = this.normalizeGeneralRanges(text, config);
    text = this.normalizeMathSymbols(text);
    text = this.normalizeRemainingNumbers(text, config);

    text = text
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/([,;:!?])(?=\S)/g, '$1 ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    protectedValues.forEach((value, index) => {
      const marker = `__TTS_${this.numberToLetters(index)}__`;
      text = text.replaceAll(marker, value);
    });

    return text;
  }

  numberToVietnameseWords(raw: string | number | bigint, zeroTensWord: 'linh' | 'lẻ' = 'linh'): string {
    const parsed = this.parseNumber(String(raw));
    const integerWords = this.integerStringToWords(parsed.integer, zeroTensWord);
    const signedInteger = parsed.sign < 0 ? `âm ${integerWords}` : integerWords;

    if (!parsed.fraction) {
      return signedInteger;
    }

    return `${signedInteger} phẩy ${this.readDigits(parsed.fraction)}`;
  }

  private normalizeLabeledCodes(text: string): string {
    const codeLabel = String.raw`(?:mã\s+(?:OTP|PIN|đơn\s+hàng|đặt\s+chỗ|giao\s+dịch|khách\s+hàng|tour|vé)|OTP|PIN|CCCD|CMND|số\s+tài\s+khoản|STK|ID|PNR|booking|biển\s+số|chuyến\s+bay|phòng)`;
    const regex = new RegExp(`\\b(${codeLabel})\\s*[:#-]?\\s*([A-Z0-9](?:[A-Z0-9./-]*[A-Z0-9])?)`, 'giu');

    return text.replace(regex, (_match, label: string, code: string) => {
      return `${label} ${this.readCode(code)}`;
    });
  }

  private normalizePhoneNumbers(text: string): string {
    const labeledPhone = /\b(số điện thoại|điện thoại|hotline|phone|tel)\s*:?\s*(\+?\d[\d\s.()-]{5,}\d)/giu;
    text = text.replace(labeledPhone, (_match, label: string, value: string) => {
      return `${label} ${this.readPhone(value)}`;
    });

    const vietnamPhone = /(?<!\d)(?:\+?84|0)(?:[\s.()-]?\d){8,10}(?!\d)/g;
    return text.replace(vietnamPhone, (value) => {
      const digits = value.replace(/\D/g, '');
      const isInternational = /^84/.test(digits);
      const localLength = isInternational ? digits.length - 2 : digits.length;
      const looksValid = localLength === 9 || localLength === 10;
      return looksValid ? this.readPhone(value) : value;
    });
  }

  private normalizeIpv4(text: string): string {
    const ipv4 = /(?<!\d)(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?(?!\d)/g;
    return text.replace(ipv4, (match, address: string, port?: string) => {
      const octets = address.split('.').map(Number);
      if (octets.some((value) => value > 255)) {
        return match;
      }

      const spokenAddress = octets
        .map((value) => this.integerStringToWords(String(value), 'linh'))
        .join(' chấm ');

      return port
        ? `${spokenAddress}, cổng ${this.integerStringToWords(port, 'linh')}`
        : spokenAddress;
    });
  }

  private normalizeVersions(text: string): string {
    const labeled = /\b(phiên bản|version|ver(?:sion)?)\s*v?\s*(\d+(?:\.\d+){1,})\b/giu;
    text = text.replace(labeled, (_match, label: string, version: string) => {
      return `${label} ${this.readVersion(version)}`;
    });

    text = text.replace(/\bv(\d+(?:\.\d+){1,})\b/giu, (_match, version: string) => {
      return `phiên bản ${this.readVersion(version)}`;
    });

    const generic = /(?<![\d.])(\d+(?:\.\d+){2,})(?![\d.])/g;
    return text.replace(generic, (version) => this.readVersion(version));
  }

  private normalizeDates(text: string, options: Required<TextNormalizerOptions>): string {
    // ISO: 2026-07-31
    text = text.replace(/(?<!\d)(?:ngày\s+)?(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/giu, (match, year, month, day) => {
      if (!this.isValidDate(Number(day), Number(month), Number(year))) {
        return match;
      }
      return this.dateToWords(day, month, year, options.zeroTensWord);
    });

    // Việt Nam: 31/07/2026, 31-07-2026, 31.07.2026
    text = text.replace(
      /(?<!\d)(?:ngày\s+)?(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})(?!\d)/giu,
      (match, day, month, year) => {
        const fullYear = String(year).length === 2 ? Number(`20${year}`) : Number(year);
        if (!this.isValidDate(Number(day), Number(month), fullYear)) {
          return match;
        }
        return this.dateToWords(day, month, year, options.zeroTensWord);
      },
    );

    // Khoảng ngày cùng tháng: 01-03/08/2026
    text = text.replace(
      /(?<!\d)(?:từ\s+ngày\s+)?(\d{1,2})\s*[–-]\s*(\d{1,2})[/.](\d{1,2})[/.](\d{4})(?!\d)/giu,
      (match, fromDay, toDay, month, year) => {
        if (
          !this.isValidDate(Number(fromDay), Number(month), Number(year)) ||
          !this.isValidDate(Number(toDay), Number(month), Number(year))
        ) {
          return match;
        }
        return `từ ngày ${this.integerStringToWords(fromDay, options.zeroTensWord)} đến ngày ${this.integerStringToWords(toDay, options.zeroTensWord)} tháng ${this.integerStringToWords(month, options.zeroTensWord)} năm ${this.integerStringToWords(year, options.zeroTensWord)}`;
      },
    );

    // Tháng/năm: 07/2026
    text = text.replace(/(?<!\d)(?:tháng\s+)?(0?[1-9]|1[0-2])[/-](\d{4})(?!\d)/giu, (_match, month, year) => {
      return `tháng ${this.integerStringToWords(month, options.zeroTensWord)} năm ${this.integerStringToWords(year, options.zeroTensWord)}`;
    });

    return text;
  }

  private normalizeYearExpressions(text: string, options: Required<TextNormalizerOptions>): string {
    text = text.replace(/\b(thập niên)\s+(\d{4})s?\b/giu, (_match, label: string, year: string) => {
      return `${label} ${this.integerStringToWords(year, options.zeroTensWord)}`;
    });

    text = text.replace(/\b(?:từ\s+năm\s+)?(\d{4})\s*[–-]\s*(\d{4})\b/giu, (_match, fromYear: string, toYear: string) => {
      return `từ năm ${this.integerStringToWords(fromYear, options.zeroTensWord)} đến năm ${this.integerStringToWords(toYear, options.zeroTensWord)}`;
    });

    text = text.replace(/\b(\d+)\s*(TCN|trước Công nguyên)\b/giu, (_match, year: string) => {
      return `${this.numberToVietnameseWords(year, options.zeroTensWord)} trước Công nguyên`;
    });

    text = text.replace(/\b(\d+)\s*(SCN|sau Công nguyên)\b/giu, (_match, year: string) => {
      return `${this.numberToVietnameseWords(year, options.zeroTensWord)} sau Công nguyên`;
    });

    return text;
  }

  private normalizeRatiosAndScores(text: string, options: Required<TextNormalizerOptions>): string {
    text = text.replace(
      /\b(tỷ lệ|tỉ lệ)\s+(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)\b/giu,
      (_match, label: string, left: string, right: string) => {
        return `${label} ${this.numberToVietnameseWords(left, options.zeroTensWord)} trên ${this.numberToVietnameseWords(right, options.zeroTensWord)}`;
      },
    );

    text = text.replace(
      /\b(tỷ số|tỉ số|kết quả)\s+(\d+)\s*[–-]\s*(\d+)\b/giu,
      (_match, label: string, left: string, right: string) => {
        return `${label} ${this.integerStringToWords(left, options.zeroTensWord)} trên ${this.integerStringToWords(right, options.zeroTensWord)}`;
      },
    );

    return text;
  }

  private normalizeTimes(text: string, options: Required<TextNormalizerOptions>): string {
    const timePattern = String.raw`(?:[01]?\d|2[0-3])(?::[0-5]\d)(?::[0-5]\d)?`;
    const rangeRegex = new RegExp(`(?<!\\d)(?:từ\\s+)?(${timePattern})\\s*[–-]\\s*(${timePattern})(?!\\d)`, 'giu');
    text = text.replace(rangeRegex, (_match, from: string, to: string) => {
      return `từ ${this.timeToWords(from, options.zeroTensWord)} đến ${this.timeToWords(to, options.zeroTensWord)}`;
    });

    const colonTime = new RegExp(`(?<!\\d)(${timePattern})(?!\\d)`, 'g');
    text = text.replace(colonTime, (value: string) => this.timeToWords(value, options.zeroTensWord));

    // 8h30, 08h30m15s
    text = text.replace(
      /(?<!\d)([01]?\d|2[0-3])\s*h\s*([0-5]?\d)?(?:\s*m\s*([0-5]?\d)\s*s?)?(?!\w)/giu,
      (_match, hour: string, minute?: string, second?: string) => {
        return this.timePartsToWords(hour, minute, second, options.zeroTensWord);
      },
    );

    return text;
  }

  private normalizeCoordinates(text: string, options: Required<TextNormalizerOptions>): string {
    return text.replace(
      /([+-]?\d+(?:[.,]\d+)?)\s*°\s*([NSEW])\b/giu,
      (_match, value: string, direction: string) => {
        const directionWords: Record<string, string> = {
          N: 'Bắc',
          S: 'Nam',
          E: 'Đông',
          W: 'Tây',
        };
        return `${this.numberToVietnameseWords(value, options.zeroTensWord)} độ ${directionWords[direction.toUpperCase()]}`;
      },
    );
  }

  private normalizeScientificNotation(text: string, options: Required<TextNormalizerOptions>): string {
    const regex = new RegExp(`(${NUMBER_PATTERN})[eE]([+-]?\\d+)`, 'g');
    return text.replace(regex, (_match, coefficient: string, exponent: string) => {
      return `${this.numberToVietnameseWords(coefficient, options.zeroTensWord)} nhân mười mũ ${this.numberToVietnameseWords(exponent, options.zeroTensWord)}`;
    });
  }

  private normalizePowers(text: string, options: Required<TextNormalizerOptions>): string {
    const regex = new RegExp(`(${NUMBER_PATTERN})\\s*\\^\\s*([+-]?\\d+)`, 'g');
    return text.replace(regex, (_match, base: string, exponent: string) => {
      return `${this.numberToVietnameseWords(base, options.zeroTensWord)} mũ ${this.numberToVietnameseWords(exponent, options.zeroTensWord)}`;
    });
  }

  private normalizeTemperatures(text: string, options: Required<TextNormalizerOptions>): string {
    const rangeRegex = new RegExp(
      `(?:từ\\s+)?(${NUMBER_PATTERN})\\s*[–-]\\s*(${NUMBER_PATTERN})\\s*°\\s*([CFK])\\b`,
      'giu',
    );
    text = text.replace(rangeRegex, (_match, from: string, to: string, scale: string) => {
      return `từ ${this.numberToVietnameseWords(from, options.zeroTensWord)} đến ${this.numberToVietnameseWords(to, options.zeroTensWord)} ${this.temperatureScale(scale)}`;
    });

    const singleRegex = new RegExp(`(${NUMBER_PATTERN})\\s*°\\s*([CFK])\\b`, 'giu');
    text = text.replace(singleRegex, (_match, value: string, scale: string) => {
      return `${this.numberToVietnameseWords(value, options.zeroTensWord)} ${this.temperatureScale(scale)}`;
    });

    return text;
  }

  private normalizePercentages(text: string, options: Required<TextNormalizerOptions>): string {
    const rangeRegex = new RegExp(`(?:từ\\s+)?(${NUMBER_PATTERN})\\s*[–-]\\s*(${NUMBER_PATTERN})\\s*%`, 'giu');
    text = text.replace(rangeRegex, (_match, from: string, to: string) => {
      return `từ ${this.numberToVietnameseWords(from, options.zeroTensWord)} đến ${this.numberToVietnameseWords(to, options.zeroTensWord)} phần trăm`;
    });

    const singleRegex = new RegExp(`(${NUMBER_PATTERN})\\s*%`, 'g');
    return text.replace(singleRegex, (_match, value: string) => {
      return `${this.numberToVietnameseWords(value, options.zeroTensWord)} phần trăm`;
    });
  }

  private normalizeCurrencies(text: string, options: Required<TextNormalizerOptions>): string {
    const currencyCodes = Object.keys(CURRENCY_WORDS)
      .sort((a, b) => b.length - a.length)
      .map(this.escapeRegExp)
      .join('|');

    const multiplierPattern = String.raw`(?:k|nghìn|ngàn|tr|triệu|tỷ|m|b)?`;
    const suffixRegex = new RegExp(
      `(${NUMBER_PATTERN})\\s*(${multiplierPattern})\\s*(${currencyCodes})(?!\\p{L})`,
      'giu',
    );

    text = text.replace(suffixRegex, (_match, value: string, multiplier: string, currency: string) => {
      const multiplierWords = this.multiplierToWords(multiplier);
      const currencyWords = CURRENCY_WORDS[currency.toLowerCase()] ?? CURRENCY_WORDS[currency] ?? currency;
      return `${this.numberToVietnameseWords(value, options.zeroTensWord)}${multiplierWords ? ` ${multiplierWords}` : ''} ${currencyWords}`;
    });

    const prefixRegex = new RegExp(`(${currencyCodes})\\s*(${NUMBER_PATTERN})`, 'giu');
    text = text.replace(prefixRegex, (_match, currency: string, value: string) => {
      const currencyWords = CURRENCY_WORDS[currency.toLowerCase()] ?? CURRENCY_WORDS[currency] ?? currency;
      return `${this.numberToVietnameseWords(value, options.zeroTensWord)} ${currencyWords}`;
    });

    // Dạng rút gọn không ghi đơn vị tiền: 150k, 2tr, 1,5 triệu.
    const shortRegex = new RegExp(`\\b(${NUMBER_PATTERN})\\s*(k|nghìn|ngàn|tr|triệu|tỷ)\\b`, 'giu');
    return text.replace(shortRegex, (_match, value: string, multiplier: string) => {
      return `${this.numberToVietnameseWords(value, options.zeroTensWord)} ${this.multiplierToWords(multiplier)}`;
    });
  }

  private normalizePerExpressions(text: string): string {
    return text.replace(
      /\/\s*(người|khách|vé|đêm|ngày|giờ|phút|tháng|năm|lần|suất)\b/giu,
      (_match, unit: string) => ` mỗi ${unit}`,
    );
  }

  private normalizeFractions(text: string, options: Required<TextNormalizerOptions>): string {
    text = text
      .replace(/½/g, ' một phần hai ')
      .replace(/¼/g, ' một phần tư ')
      .replace(/¾/g, ' ba phần tư ')
      .replace(/⅓/g, ' một phần ba ')
      .replace(/⅔/g, ' hai phần ba ');

    const mixed = new RegExp(`(?<!\\d)(${UNSIGNED_NUMBER_PATTERN})\\s+(${UNSIGNED_NUMBER_PATTERN})\\s*\\/\\s*(${UNSIGNED_NUMBER_PATTERN})(?!\\d)`, 'g');
    text = text.replace(mixed, (_match, whole: string, numerator: string, denominator: string) => {
      return `${this.numberToVietnameseWords(whole, options.zeroTensWord)} và ${this.numberToVietnameseWords(numerator, options.zeroTensWord)} phần ${this.numberToVietnameseWords(denominator, options.zeroTensWord)}`;
    });

    const simple = new RegExp(`(?<!\\d)(${UNSIGNED_NUMBER_PATTERN})\\s*\\/\\s*(${UNSIGNED_NUMBER_PATTERN})(?!\\d)`, 'g');
    return text.replace(simple, (_match, numerator: string, denominator: string) => {
      return `${this.numberToVietnameseWords(numerator, options.zeroTensWord)} phần ${this.numberToVietnameseWords(denominator, options.zeroTensWord)}`;
    });
  }

  private normalizeDimensions(text: string, options: Required<TextNormalizerOptions>): string {
    const unitKeys = this.unitRegexSource();
    const regex = new RegExp(
      `(${NUMBER_PATTERN})(?:\\s*[x×*]\\s*(${NUMBER_PATTERN}))(?:\\s*[x×*]\\s*(${NUMBER_PATTERN}))?\\s*(${unitKeys})?`,
      'giu',
    );

    return text.replace(regex, (match, first: string, second?: string, third?: string, unit?: string) => {
      if (!second) {
        return match;
      }
      const values = [first, second, third]
        .filter((value): value is string => Boolean(value))
        .map((value) => this.numberToVietnameseWords(value, options.zeroTensWord))
        .join(' nhân ');
      return `${values}${unit ? ` ${this.unitToWords(unit)}` : ''}`;
    });
  }

  private normalizeUnitValues(text: string, options: Required<TextNormalizerOptions>): string {
    const units = this.unitRegexSource();
    const rangeRegex = new RegExp(
      `(?:từ\\s+)?(${NUMBER_PATTERN})\\s*[–-]\\s*(${NUMBER_PATTERN})\\s*(${units})(?!\\p{L})`,
      'giu',
    );

    text = text.replace(rangeRegex, (_match, from: string, to: string, unit: string) => {
      return `từ ${this.numberToVietnameseWords(from, options.zeroTensWord)} đến ${this.numberToVietnameseWords(to, options.zeroTensWord)} ${this.unitToWords(unit)}`;
    });

    const singleRegex = new RegExp(`(${NUMBER_PATTERN})\\s*(${units})(?!\\p{L})`, 'giu');
    return text.replace(singleRegex, (_match, value: string, unit: string) => {
      return `${this.numberToVietnameseWords(value, options.zeroTensWord)} ${this.unitToWords(unit)}`;
    });
  }

  private normalizeOrdinals(text: string, options: Required<TextNormalizerOptions>): string {
    text = text.replace(/\b(thứ)\s+(\d+)\b/giu, (_match, label: string, value: string) => {
      return `${label} ${this.ordinalToWords(value, 'thứ', options.zeroTensWord)}`;
    });

    text = text.replace(/\b(hạng)\s+(\d+)\b/giu, (_match, label: string, value: string) => {
      return `${label} ${this.ordinalToWords(value, 'hạng', options.zeroTensWord)}`;
    });

    text = text.replace(/\b(top)\s*(\d+)\b/giu, (_match, label: string, value: string) => {
      return `${label} ${this.numberToVietnameseWords(value, options.zeroTensWord)}`;
    });

    return text;
  }

  private normalizeRomanNumerals(text: string, options: Required<TextNormalizerOptions>): string {
    const regex = /\b(chương|phần|mục|tập|quyển|thế kỷ|thế hệ)\s+([IVXLCDM]+)\b/giu;
    return text.replace(regex, (match, label: string, roman: string) => {
      const value = this.romanToInteger(roman.toUpperCase());
      if (value <= 0) {
        return match;
      }
      return `${label} ${this.integerStringToWords(String(value), options.zeroTensWord)}`;
    });
  }

  private normalizeGeneralRanges(text: string, options: Required<TextNormalizerOptions>): string {
    // Chỉ nhận dấu gạch ngang giữa hai số; các trường hợp ngày, giờ, nhiệt độ,
    // đơn vị, phần trăm và năm đã được xử lý trước.
    const regex = new RegExp(`(?<![\\d-])(?:từ\\s+)?(${UNSIGNED_NUMBER_PATTERN})\\s*[–-]\\s*(${UNSIGNED_NUMBER_PATTERN})(?!\\d)`, 'giu');
    return text.replace(regex, (_match, from: string, to: string) => {
      return `từ ${this.numberToVietnameseWords(from, options.zeroTensWord)} đến ${this.numberToVietnameseWords(to, options.zeroTensWord)}`;
    });
  }

  private normalizeMathSymbols(text: string): string {
    return text
      .replace(/\s*×\s*/g, ' nhân ')
      .replace(/\s*÷\s*/g, ' chia ')
      .replace(/\s*=\s*/g, ' bằng ')
      .replace(/\s*≈\s*/g, ' xấp xỉ ')
      .replace(/\s*≥\s*/g, ' lớn hơn hoặc bằng ')
      .replace(/\s*≤\s*/g, ' nhỏ hơn hoặc bằng ')
      .replace(/\s*>\s*/g, ' lớn hơn ')
      .replace(/\s*<\s*/g, ' nhỏ hơn ');
  }

  private normalizeRemainingNumbers(text: string, options: Required<TextNormalizerOptions>): string {
    const regex = new RegExp(`(?<![\\p{L}\\p{N}_])(${NUMBER_PATTERN})(?![\\p{L}\\p{N}_])`, 'gu');
    return text.replace(regex, (_match, value: string) => {
      return this.numberToVietnameseWords(value, options.zeroTensWord);
    });
  }

  private parseNumber(raw: string): ParsedNumber {
    let value = raw.trim().replace(/\s+/g, '');
    let sign: -1 | 1 = 1;

    if (value.startsWith('-')) {
      sign = -1;
      value = value.slice(1);
    } else if (value.startsWith('+')) {
      value = value.slice(1);
    }

    const lastDot = value.lastIndexOf('.');
    const lastComma = value.lastIndexOf(',');
    const hasDot = lastDot >= 0;
    const hasComma = lastComma >= 0;

    let integer = value;
    let fraction = '';

    if (hasDot && hasComma) {
      const decimalIndex = Math.max(lastDot, lastComma);
      integer = value.slice(0, decimalIndex).replace(/[.,]/g, '');
      fraction = value.slice(decimalIndex + 1).replace(/[.,]/g, '');
    } else if (hasDot || hasComma) {
      const separator = hasDot ? '.' : ',';
      const pieces = value.split(separator);
      const allTrailingGroupsHaveThreeDigits = pieces.slice(1).every((piece) => piece.length === 3);
      const looksLikeThousands =
        pieces.length > 2
          ? allTrailingGroupsHaveThreeDigits
          : pieces[1]?.length === 3 && pieces[0].length >= 1 && pieces[0].length <= 3;

      if (looksLikeThousands) {
        integer = pieces.join('');
      } else {
        integer = pieces[0] || '0';
        fraction = pieces.slice(1).join('');
      }
    }

    integer = integer.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0';
    fraction = fraction.replace(/\D/g, '');

    return { sign, integer, fraction };
  }

  private integerStringToWords(raw: string, zeroTensWord: 'linh' | 'lẻ'): string {
    const cleaned = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0';
    if (cleaned === '0') {
      return DIGIT_WORDS[0];
    }

    const groups: number[] = [];
    for (let end = cleaned.length; end > 0; end -= 3) {
      const start = Math.max(0, end - 3);
      groups.unshift(Number(cleaned.slice(start, end)));
    }

    if (groups.length > SCALE_WORDS.length) {
      // Số quá lớn: đọc từng chữ số để không phát âm sai hoặc tràn kiểu dữ liệu.
      return this.readDigits(cleaned);
    }

    const output: string[] = [];
    let hasReadHigherGroup = false;

    groups.forEach((groupValue, index) => {
      if (groupValue === 0) {
        return;
      }

      const scaleIndex = groups.length - index - 1;
      const forceFullHundreds = hasReadHigherGroup && groupValue < 100;
      const groupWords = this.readThreeDigits(groupValue, forceFullHundreds, zeroTensWord);
      output.push(groupWords);
      if (SCALE_WORDS[scaleIndex]) {
        output.push(SCALE_WORDS[scaleIndex]);
      }
      hasReadHigherGroup = true;
    });

    return output.join(' ').replace(/\s+/g, ' ').trim();
  }

  private readThreeDigits(value: number, forceFullHundreds: boolean, zeroTensWord: 'linh' | 'lẻ'): string {
    const hundreds = Math.floor(value / 100);
    const tens = Math.floor((value % 100) / 10);
    const units = value % 10;
    const words: string[] = [];

    if (hundreds > 0 || forceFullHundreds) {
      words.push(DIGIT_WORDS[hundreds], 'trăm');
    }

    if (tens > 1) {
      words.push(DIGIT_WORDS[tens], 'mươi');
      if (units === 1) words.push('mốt');
      else if (units === 4) words.push('tư');
      else if (units === 5) words.push('lăm');
      else if (units > 0) words.push(DIGIT_WORDS[units]);
    } else if (tens === 1) {
      words.push('mười');
      if (units === 5) words.push('lăm');
      else if (units > 0) words.push(DIGIT_WORDS[units]);
    } else if (units > 0) {
      if (hundreds > 0 || forceFullHundreds) {
        words.push(zeroTensWord);
      }
      words.push(DIGIT_WORDS[units]);
    }

    return words.join(' ');
  }

  private readDigits(value: string): string {
    return [...value]
      .filter((char) => /\d/.test(char))
      .map((char) => DIGIT_WORDS[Number(char)])
      .join(' ');
  }

  private readPhone(value: string): string {
    const trimmed = value.trim();
    const prefix = trimmed.startsWith('+') ? 'cộng ' : '';
    return `${prefix}${this.readDigits(trimmed)}`.trim();
  }

  private readCode(value: string): string {
    const words: string[] = [];
    for (const char of value.toUpperCase()) {
      if (/\d/.test(char)) {
        words.push(DIGIT_WORDS[Number(char)]);
      } else if (LETTER_WORDS[char]) {
        words.push(LETTER_WORDS[char]);
      } else if (char === '.') {
        words.push('chấm');
      } else if (char === '/') {
        words.push('gạch chéo');
      } else if (char === '-') {
        words.push('gạch ngang');
      }
    }
    return words.join(' ');
  }

  private readVersion(version: string): string {
    return version
      .split('.')
      .map((segment) => this.integerStringToWords(segment, 'linh'))
      .join(' chấm ');
  }

  private dateToWords(day: string, month: string, year: string, zeroTensWord: 'linh' | 'lẻ'): string {
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    return `ngày ${this.integerStringToWords(day, zeroTensWord)} tháng ${this.integerStringToWords(month, zeroTensWord)} năm ${this.integerStringToWords(normalizedYear, zeroTensWord)}`;
  }

  private isValidDate(day: number, month: number, year: number): boolean {
    if (year < 1 || month < 1 || month > 12 || day < 1) {
      return false;
    }
    return day <= new Date(year, month, 0).getDate();
  }

  private timeToWords(value: string, zeroTensWord: 'linh' | 'lẻ'): string {
    const [hour, minute, second] = value.split(':');
    return this.timePartsToWords(hour, minute, second, zeroTensWord);
  }

  private timePartsToWords(
    hour: string,
    minute: string | undefined,
    second: string | undefined,
    zeroTensWord: 'linh' | 'lẻ',
  ): string {
    const words = [`${this.integerStringToWords(hour, zeroTensWord)} giờ`];
    if (minute !== undefined && Number(minute) > 0) {
      words.push(`${this.integerStringToWords(minute, zeroTensWord)} phút`);
    }
    if (second !== undefined && Number(second) > 0) {
      words.push(`${this.integerStringToWords(second, zeroTensWord)} giây`);
    }
    return words.join(' ');
  }

  private temperatureScale(scale: string): string {
    const normalized = scale.toUpperCase();
    if (normalized === 'C') return 'độ xê';
    if (normalized === 'F') return 'độ ép';
    return 'độ ca';
  }

  private multiplierToWords(multiplier: string): string {
    const normalized = multiplier.trim().toLowerCase();
    const map: Record<string, string> = {
      k: 'nghìn',
      nghìn: 'nghìn',
      ngàn: 'nghìn',
      tr: 'triệu',
      triệu: 'triệu',
      m: 'triệu',
      tỷ: 'tỷ',
      b: 'tỷ',
    };
    return map[normalized] ?? '';
  }

  private unitRegexSource(): string {
    return Object.keys(UNIT_WORDS)
      .sort((a, b) => b.length - a.length)
      .map(this.escapeRegExp)
      .join('|');
  }

  private unitToWords(unit: string): string {
    return UNIT_WORDS[unit] ?? UNIT_WORDS[unit.toLowerCase()] ?? unit;
  }

  private ordinalToWords(
    raw: string,
    context: 'thứ' | 'hạng',
    zeroTensWord: 'linh' | 'lẻ',
  ): string {
    const value = Number(raw);
    if (value === 1) return 'nhất';
    if (value === 2 && context === 'hạng') return 'nhì';
    return this.integerStringToWords(raw, zeroTensWord);
  }

  private romanToInteger(roman: string): number {
    const values: Record<string, number> = {
      I: 1,
      V: 5,
      X: 10,
      L: 50,
      C: 100,
      D: 500,
      M: 1000,
    };
    let total = 0;
    let previous = 0;

    for (let index = roman.length - 1; index >= 0; index -= 1) {
      const current = values[roman[index]] ?? 0;
      if (current < previous) total -= current;
      else total += current;
      previous = current;
    }

    return total;
  }

  private numberToLetters(index: number): string {
    let value = index;
    let output = '';
    do {
      output = String.fromCharCode(65 + (value % 26)) + output;
      value = Math.floor(value / 26) - 1;
    } while (value >= 0);
    return output;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
