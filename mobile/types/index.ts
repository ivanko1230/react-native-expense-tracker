export type ExpenseCategory = 
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Travel'
  | 'Other';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
}

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AddExpense: undefined;
};

export type MainTabParamList = {
  Expenses: undefined;
  Summary: undefined;
};
