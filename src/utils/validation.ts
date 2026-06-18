export function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return /^TR\d{24}$/.test(cleaned);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^(90)?\d{10}$/.test(cleaned) || /^\d{10}$/.test(cleaned);
}

export function validatePercentageSum(percentages: number[]): boolean {
  const sum = percentages.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) < 0.01;
}

export function validateExactSum(amounts: number[], total: number): boolean {
  const sum = amounts.reduce((a, b) => a + b, 0);
  return Math.abs(sum - total) < 0.01;
}
