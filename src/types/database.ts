import type { ExpenseCategory, GroupCategory } from '../constants/categories';

export type SplitType = 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'ITEMIZED';
export type NotificationType =
  | 'expense_added' | 'payment_pending' | 'payment_confirmed'
  | 'payment_rejected' | 'nudge' | 'overdue_reminder' | 'bill_reminder';

export interface DbUser {
  id: string;
  phone_number: string | null;
  full_name: string;
  avatar_url: string | null;
  iban: string | null;
  kolay_adres: string | null;
  fcm_token: string | null;
  apns_token: string | null;
  created_at: string;
}

export interface DbGroup {
  id: string;
  title: string;
  cover_image_url: string | null;
  category: GroupCategory;
  created_by: string;
  deleted_at: string | null;
  created_at: string;
}

export interface DbGroupMember {
  group_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface DbExpense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: number;
  currency: string;
  description: string;
  category: ExpenseCategory;
  split_type: SplitType;
  document_url: string | null;
  ocr_raw_text: string | null;
  ocr_parsed_data: OcrParsedData | null;
  date: string;
  created_at: string;
}

export interface DbExpenseParticipant {
  expense_id: string;
  user_id: string;
  exact_amount: number;
}

export interface DbDebt {
  id: string;
  group_id: string;
  debtor_id: string;
  creditor_id: string;
  amount: number;
  currency: string;
  is_settled: boolean;
  settled_at: string | null;
  overdue_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbGroupInvite {
  id: string;
  group_id: string;
  created_by: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface DbRecurringBillReminder {
  id: string;
  user_id: string;
  group_id: string | null;
  expense_id: string;
  category: ExpenseCategory;
  vendor_name: string;
  last_amount: number;
  last_due_date: string;
  next_reminder_date: string;
  reminder_enabled: boolean;
  reminder_days_before: number;
  reminder_hour: string;
  created_at: string;
  updated_at: string;
}

export interface OcrParsedData {
  total_amount: number;
  currency: string;
  vendor_name: string;
  invoice_date: string | null;
  invoice_due_date: string | null;
  invoice_period: string | null;
  category: ExpenseCategory;
  line_items: { name: string; amount: number }[];
  confidence: number;
}
