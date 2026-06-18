export type ExpenseCategory =
  | 'RENT' | 'BILL_ELECTRICITY' | 'BILL_WATER' | 'BILL_GAS'
  | 'BILL_INTERNET' | 'BILL_OTHER' | 'GROCERIES' | 'DINING'
  | 'TRANSPORT' | 'ACCOMMODATION' | 'EDUCATION' | 'HEALTH'
  | 'ENTERTAINMENT' | 'SUBSCRIPTION' | 'OTHER';

export type GroupCategory = 'tatil' | 'ev' | 'cift' | 'yemek' | 'etkinlik' | 'diger';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'RENT', label: 'Kira', icon: 'home' },
  { value: 'BILL_ELECTRICITY', label: 'Elektrik Faturası', icon: 'zap' },
  { value: 'BILL_WATER', label: 'Su Faturası', icon: 'droplet' },
  { value: 'BILL_GAS', label: 'Doğalgaz Faturası', icon: 'thermometer' },
  { value: 'BILL_INTERNET', label: 'İnternet / Telefon', icon: 'wifi' },
  { value: 'BILL_OTHER', label: 'Diğer Fatura', icon: 'file-text' },
  { value: 'GROCERIES', label: 'Market / Alışveriş', icon: 'shopping-cart' },
  { value: 'DINING', label: 'Yemek / Dışarıda Yeme', icon: 'coffee' },
  { value: 'TRANSPORT', label: 'Ulaşım', icon: 'map-pin' },
  { value: 'ACCOMMODATION', label: 'Konaklama', icon: 'briefcase' },
  { value: 'EDUCATION', label: 'Eğitim', icon: 'book' },
  { value: 'HEALTH', label: 'Sağlık', icon: 'heart' },
  { value: 'ENTERTAINMENT', label: 'Eğlence', icon: 'music' },
  { value: 'SUBSCRIPTION', label: 'Abonelik', icon: 'repeat' },
  { value: 'OTHER', label: 'Diğer', icon: 'more-horizontal' },
];

export const GROUP_CATEGORIES: { value: GroupCategory; label: string; icon: string }[] = [
  { value: 'tatil', label: 'Tatil', icon: 'sun' },
  { value: 'ev', label: 'Ev Arkadaşları', icon: 'home' },
  { value: 'cift', label: 'Çift / Hane', icon: 'users' },
  { value: 'yemek', label: 'Yemek', icon: 'coffee' },
  { value: 'etkinlik', label: 'Etkinlik', icon: 'calendar' },
  { value: 'diger', label: 'Diğer', icon: 'grid' },
];

export const BILL_CATEGORIES: ExpenseCategory[] = [
  'BILL_ELECTRICITY', 'BILL_WATER', 'BILL_GAS',
  'BILL_INTERNET', 'BILL_OTHER', 'RENT', 'SUBSCRIPTION',
];
