export function formatAmount(amount: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatAmountCompact(amount: number): string {
  return (
    new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' ₺'
  );
}

export function formatBalance(amount: number): string {
  const prefix = amount > 0 ? '+' : '';
  return prefix + formatAmountCompact(amount);
}
