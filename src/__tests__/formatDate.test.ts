import { formatDate, formatDateShort, formatRelativeTime } from '../utils/formatDate';

describe('formatDate', () => {
  it('formats date in full Turkish format', () => {
    expect(formatDate('2024-06-15')).toBe('15 Haziran 2024');
    expect(formatDate('2024-01-01')).toBe('1 Ocak 2024');
    expect(formatDate('2024-12-31')).toBe('31 Aralık 2024');
  });

  it('accepts Date objects', () => {
    const d = new Date('2024-03-20');
    expect(formatDate(d)).toBe('20 Mart 2024');
  });

  it('formats all 12 Turkish month names correctly', () => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ];
    months.forEach((month, i) => {
      const mm = String(i + 1).padStart(2, '0');
      expect(formatDate(`2024-${mm}-15`)).toContain(month);
    });
  });
});

describe('formatDateShort', () => {
  it('formats as day + abbreviated month', () => {
    expect(formatDateShort('2024-06-15')).toBe('15 Haz');
    expect(formatDateShort('2024-01-01')).toBe('1 Oca');
  });

  it('no year in short format', () => {
    const result = formatDateShort('2024-06-15');
    expect(result).not.toContain('2024');
  });
});

describe('formatRelativeTime', () => {
  const RealDate = Date;

  function mockDate(isoStr: string) {
    const fixed = new RealDate(isoStr);
    global.Date = class extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(isoStr);
        } else {
          super(...(args as [any]));
        }
      }
      static now() { return fixed.getTime(); }
    } as any;
  }

  afterEach(() => {
    global.Date = RealDate;
  });

  it('returns "Bugün" for same day', () => {
    mockDate('2024-06-15T12:00:00Z');
    expect(formatRelativeTime('2024-06-15T08:00:00Z')).toBe('Bugün');
  });

  it('returns "Dün" for 1 day ago', () => {
    mockDate('2024-06-15T12:00:00Z');
    expect(formatRelativeTime('2024-06-14T12:00:00Z')).toBe('Dün');
  });

  it('returns "N gün önce" for 2-6 days ago', () => {
    mockDate('2024-06-15T12:00:00Z');
    expect(formatRelativeTime('2024-06-12T12:00:00Z')).toBe('3 gün önce');
    expect(formatRelativeTime('2024-06-09T12:00:00Z')).toBe('6 gün önce');
  });

  it('falls back to short date for 7+ days ago', () => {
    mockDate('2024-06-15T12:00:00Z');
    const result = formatRelativeTime('2024-06-08T12:00:00Z');
    expect(result).toBe('8 Haz');
  });
});
