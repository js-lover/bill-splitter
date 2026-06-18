import type { OcrParsedData } from './database';

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneInput: undefined;
  OTPVerification: { phoneNumber: string };
  ProfileSetup: undefined;
};

export type AppTabParamList = {
  HomeTab: undefined;
  DebtsTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  CreateGroup: undefined;
  AddMembers: { groupId: string };
  GroupDetail: { groupId: string };
  AddExpense: { groupId: string; prefillData?: Partial<OcrParsedData> };
  ExpenseDetail: { expenseId: string; groupId: string };
  DocumentScan: { groupId: string };
  OCRConfirm: { imagePath: string; groupId: string };
  GroupSettings: { groupId: string };
};

export type DebtsStackParamList = {
  MyDebts: undefined;
  MyCredits: undefined;
  DebtDetail: { debtId: string };
  QRPayment: { debtId: string; amount: number; ibanNumber: string; creditorName: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  ReminderSettings: undefined;
};

export type NotificationsStackParamList = {
  Notifications: undefined;
};
