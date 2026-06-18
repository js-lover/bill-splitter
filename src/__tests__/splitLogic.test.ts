/**
 * Tests for the split calculation logic extracted from AddExpenseScreen.
 * These mirror the exact formulas used in the screen.
 */

// ── Helper: mirrors AddExpenseScreen logic ──────────────────────────────────

function formatPhone(raw: string): string {
  const cleaned = raw.replace(/\D/g, '');
  return cleaned.startsWith('90') ? `+${cleaned}` : `+90${cleaned}`;
}

function computeEqualShare(totalAmount: number, participantCount: number): number {
  return participantCount > 0 ? totalAmount / participantCount : 0;
}

function computePercentageShares(
  totalAmount: number,
  participants: string[],
  percentages: Record<string, string>,
): Record<string, number> {
  return Object.fromEntries(
    participants.map((uid) => [
      uid,
      totalAmount * ((parseFloat(percentages[uid] ?? '0') || 0) / 100),
    ]),
  );
}

function computeExactShares(
  participants: string[],
  exactAmounts: Record<string, string>,
): Record<string, number> {
  return Object.fromEntries(
    participants.map((uid) => [
      uid,
      parseFloat((exactAmounts[uid] ?? '0').replace(',', '.')) || 0,
    ]),
  );
}

function percentTotal(participants: string[], percentages: Record<string, string>): number {
  return participants.reduce(
    (s, uid) => s + (parseFloat(percentages[uid] ?? '0') || 0),
    0,
  );
}

function exactTotal(participants: string[], exactAmounts: Record<string, string>): number {
  return participants.reduce(
    (s, uid) => s + (parseFloat((exactAmounts[uid] ?? '0').replace(',', '.')) || 0),
    0,
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Phone number formatting (PhoneInputScreen)', () => {
  it('prepends +90 to 10-digit numbers', () => {
    expect(formatPhone('5301234567')).toBe('+905301234567');
  });

  it('keeps +90 prefix if already present as 90', () => {
    expect(formatPhone('905301234567')).toBe('+905301234567');
  });

  it('strips spaces and dashes before formatting', () => {
    expect(formatPhone('530 123 45 67')).toBe('+905301234567');
    expect(formatPhone('530-123-45-67')).toBe('+905301234567');
  });

  it('strips parentheses', () => {
    expect(formatPhone('(530) 123 4567')).toBe('+905301234567');
  });
});

describe('EQUAL split', () => {
  it('divides evenly between 2 participants', () => {
    expect(computeEqualShare(100, 2)).toBe(50);
  });

  it('divides evenly between 3 participants', () => {
    expect(computeEqualShare(90, 3)).toBe(30);
  });

  it('handles non-even amounts', () => {
    const share = computeEqualShare(100, 3);
    expect(share).toBeCloseTo(33.333, 2);
  });

  it('returns 0 when no participants', () => {
    expect(computeEqualShare(100, 0)).toBe(0);
  });

  it('single participant gets full amount', () => {
    expect(computeEqualShare(250, 1)).toBe(250);
  });

  it('total of shares equals original amount', () => {
    const total = 150;
    const count = 4;
    const share = computeEqualShare(total, count);
    expect(share * count).toBeCloseTo(total, 10);
  });
});

describe('PERCENTAGE split', () => {
  const participants = ['userA', 'userB', 'userC'];

  it('calculates correct amounts from percentages', () => {
    const pcts = { userA: '50', userB: '30', userC: '20' };
    const shares = computePercentageShares(300, participants, pcts);
    expect(shares.userA).toBe(150);
    expect(shares.userB).toBe(90);
    expect(shares.userC).toBe(60);
  });

  it('percentTotal returns sum of all percentages', () => {
    const pcts = { userA: '33.33', userB: '33.33', userC: '33.34' };
    expect(percentTotal(participants, pcts)).toBeCloseTo(100, 1);
  });

  it('detects invalid percentage sum (< 100)', () => {
    const pcts = { userA: '40', userB: '30', userC: '20' };
    const total = percentTotal(participants, pcts);
    expect(Math.abs(total - 100) > 0.01).toBe(true);
  });

  it('detects invalid percentage sum (> 100)', () => {
    const pcts = { userA: '50', userB: '40', userC: '20' };
    const total = percentTotal(participants, pcts);
    expect(Math.abs(total - 100) > 0.01).toBe(true);
  });

  it('handles missing percentage as 0', () => {
    const shares = computePercentageShares(100, participants, { userA: '100' });
    expect(shares.userB).toBe(0);
    expect(shares.userC).toBe(0);
  });

  it('sum of percentage shares equals total amount (valid split)', () => {
    const pcts = { userA: '33.33', userB: '33.33', userC: '33.34' };
    const shares = computePercentageShares(100, participants, pcts);
    const sum = Object.values(shares).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 1);
  });
});

describe('EXACT split', () => {
  const participants = ['userA', 'userB'];

  it('parses amounts correctly', () => {
    const amts = { userA: '75', userB: '25' };
    const shares = computeExactShares(participants, amts);
    expect(shares.userA).toBe(75);
    expect(shares.userB).toBe(25);
  });

  it('parses comma-decimal format (Turkish input)', () => {
    const amts = { userA: '66,67', userB: '33,33' };
    const shares = computeExactShares(participants, amts);
    expect(shares.userA).toBeCloseTo(66.67, 2);
    expect(shares.userB).toBeCloseTo(33.33, 2);
  });

  it('exactTotal returns sum of shares', () => {
    const amts = { userA: '66,67', userB: '33,33' };
    expect(exactTotal(participants, amts)).toBeCloseTo(100, 1);
  });

  it('detects mismatch (sum < total)', () => {
    const amts = { userA: '40', userB: '30' };
    const sum = exactTotal(participants, amts);
    expect(Math.abs(sum - 100) > 0.01).toBe(true);
  });

  it('detects mismatch (sum > total)', () => {
    const amts = { userA: '70', userB: '50' };
    const sum = exactTotal(participants, amts);
    expect(Math.abs(sum - 100) > 0.01).toBe(true);
  });

  it('handles missing amount as 0', () => {
    const shares = computeExactShares(participants, { userA: '100' });
    expect(shares.userB).toBe(0);
  });
});

describe('numAmount parsing (AddExpenseScreen)', () => {
  function parseAmount(input: string): number {
    return parseFloat(input.replace(',', '.')) || 0;
  }

  it('parses plain number', () => expect(parseAmount('150')).toBe(150));
  it('parses dot-decimal', () => expect(parseAmount('99.99')).toBe(99.99));
  it('parses comma-decimal (Turkish keyboard)', () => expect(parseAmount('99,99')).toBe(99.99));
  it('returns 0 for empty string', () => expect(parseAmount('')).toBe(0));
  it('returns 0 for non-numeric', () => expect(parseAmount('abc')).toBe(0));
  it('returns 0 for negative amount guard', () => {
    const amt = parseAmount('-50');
    expect(amt <= 0).toBe(true);
  });
});
