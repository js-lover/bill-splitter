import { formatAmount, formatAmountCompact, formatBalance } from '../utils/formatCurrency';

describe('formatAmount', () => {
  it('formats TRY amounts with Turkish locale', () => {
    expect(formatAmount(150.5)).toBe('₺150,50');
    expect(formatAmount(1000)).toBe('₺1.000,00');
    expect(formatAmount(0)).toBe('₺0,00');
    expect(formatAmount(99.99)).toBe('₺99,99');
  });

  it('formats USD amounts', () => {
    const result = formatAmount(100, 'USD');
    expect(result).toContain('100');
    expect(result).toContain('$');
  });

  it('formats EUR amounts', () => {
    const result = formatAmount(100, 'EUR');
    expect(result).toContain('100');
    expect(result).toContain('€');
  });

  it('handles large amounts with thousand separators', () => {
    expect(formatAmount(12345.67)).toBe('₺12.345,67');
    expect(formatAmount(1000000)).toBe('₺1.000.000,00');
  });

  it('always shows 2 decimal places', () => {
    expect(formatAmount(5)).toBe('₺5,00');
    expect(formatAmount(5.1)).toBe('₺5,10');
  });
});

describe('formatAmountCompact', () => {
  it('appends ₺ suffix', () => {
    expect(formatAmountCompact(150.5)).toBe('150,50 ₺');
  });

  it('formats with Turkish decimal separator', () => {
    expect(formatAmountCompact(1234.56)).toBe('1.234,56 ₺');
  });

  it('handles zero', () => {
    expect(formatAmountCompact(0)).toBe('0,00 ₺');
  });
});

describe('formatBalance', () => {
  it('adds + prefix for positive amounts', () => {
    expect(formatBalance(100)).toBe('+100,00 ₺');
    expect(formatBalance(0.01)).toBe('+0,01 ₺');
  });

  it('no prefix change for negative (Intl handles -)', () => {
    expect(formatBalance(-50)).toBe('-50,00 ₺');
  });

  it('adds + but not for zero (zero has no sign)', () => {
    // 0 is not > 0, so no prefix
    expect(formatBalance(0)).toBe('0,00 ₺');
  });
});
