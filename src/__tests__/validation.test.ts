import {
  validateIBAN,
  validatePhone,
  validatePercentageSum,
  validateExactSum,
} from '../utils/validation';

describe('validateIBAN', () => {
  it('accepts valid TR IBAN (26 chars)', () => {
    expect(validateIBAN('TR320010009999901234567890')).toBe(true);
    expect(validateIBAN('TR000000000000000000000000')).toBe(true);
    expect(validateIBAN('TR999999999999999999999999')).toBe(true);
  });

  it('rejects non-TR IBANs', () => {
    expect(validateIBAN('DE89370400440532013000')).toBe(false);
    expect(validateIBAN('GB29NWBK60161331926819')).toBe(false);
  });

  it('rejects too short', () => {
    expect(validateIBAN('TR32001000999990123456789')).toBe(false); // 25 chars
  });

  it('rejects too long', () => {
    expect(validateIBAN('TR3200100099999012345678901')).toBe(false); // 27 chars
  });

  it('rejects letters after TR prefix', () => {
    expect(validateIBAN('TR32001000999990123456789A')).toBe(false);
  });

  it('strips whitespace before validating', () => {
    expect(validateIBAN('TR32 0010 0099 9990 1234 5678 90')).toBe(true);
  });

  it('is case insensitive for prefix', () => {
    expect(validateIBAN('tr320010009999901234567890')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateIBAN('')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('accepts 10-digit Turkish numbers', () => {
    expect(validatePhone('5301234567')).toBe(true);
    expect(validatePhone('5001234567')).toBe(true);
  });

  it('accepts 12-digit with country code 90', () => {
    expect(validatePhone('905301234567')).toBe(true);
  });

  it('strips non-digit characters before validating', () => {
    expect(validatePhone('530 123 45 67')).toBe(true);
    expect(validatePhone('(530) 123-4567')).toBe(true);
  });

  it('rejects 9-digit numbers', () => {
    expect(validatePhone('530123456')).toBe(false);
  });

  it('rejects 11-digit numbers (not starting with 90)', () => {
    expect(validatePhone('53012345678')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validatePhone('')).toBe(false);
  });
});

describe('validatePercentageSum', () => {
  it('accepts percentages that sum to exactly 100', () => {
    expect(validatePercentageSum([100])).toBe(true);
    expect(validatePercentageSum([50, 50])).toBe(true);
    expect(validatePercentageSum([33.33, 33.33, 33.34])).toBe(true);
    expect(validatePercentageSum([25, 25, 25, 25])).toBe(true);
  });

  it('accepts percentages within 0.01 tolerance', () => {
    expect(validatePercentageSum([33.333, 33.333, 33.333])).toBe(true); // sum = 99.999
    expect(validatePercentageSum([33.34, 33.33, 33.33])).toBe(true); // sum = 100.00
  });

  it('rejects percentages that do not sum to 100', () => {
    expect(validatePercentageSum([50, 40])).toBe(false); // 90
    expect(validatePercentageSum([50, 60])).toBe(false); // 110
    expect(validatePercentageSum([0])).toBe(false);
  });

  it('handles empty array (sum = 0, not 100)', () => {
    expect(validatePercentageSum([])).toBe(false);
  });

  it('handles floating point edge case', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS
    expect(validatePercentageSum([0.1, 99.9])).toBe(true);
  });
});

describe('validateExactSum', () => {
  it('accepts amounts that match total', () => {
    expect(validateExactSum([50, 50], 100)).toBe(true);
    expect(validateExactSum([33.33, 33.33, 33.34], 100)).toBe(true);
    expect(validateExactSum([100], 100)).toBe(true);
  });

  it('accepts within 0.01 tolerance', () => {
    expect(validateExactSum([33.333, 33.333, 33.334], 100)).toBe(true);
  });

  it('rejects when sum does not match total', () => {
    expect(validateExactSum([40, 50], 100)).toBe(false); // 90 ≠ 100
    expect(validateExactSum([60, 50], 100)).toBe(false); // 110 ≠ 100
  });

  it('works with decimal totals', () => {
    expect(validateExactSum([12.5, 12.5], 25)).toBe(true);
    expect(validateExactSum([12.4, 12.5], 25)).toBe(false);
  });

  it('handles empty array', () => {
    expect(validateExactSum([], 100)).toBe(false);
    expect(validateExactSum([], 0)).toBe(true);
  });
});
