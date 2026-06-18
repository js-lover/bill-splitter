import type { DbUser, DbGroup, DbExpense, DbDebt, DbGroupMember } from './database';

export interface User extends DbUser {
  displayName: string;
}

export interface GroupMemberWithUser extends DbGroupMember {
  user: User;
}

export interface Group extends DbGroup {
  members: GroupMemberWithUser[];
  myBalance: number;
  totalSpend: number;
}

export interface ExpenseWithParticipants extends DbExpense {
  paidByUser: User;
  participants: { user: User; exact_amount: number }[];
}

export interface DebtWithUsers extends DbDebt {
  debtor: User;
  creditor: User;
}
