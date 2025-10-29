import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../types';

const STORAGE_KEYS = {
  EXPENSES: '@expenses',
  PENDING_EXPENSES: '@pending_expenses',
  DELETED_EXPENSES: '@deleted_expenses',
};

interface PendingExpense extends Expense {
  pendingId: string;
  synced: boolean;
}

// Save expenses locally
export const saveExpensesLocally = async (expenses: Expense[]): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return true;
  } catch (error) {
    console.error('Error saving expenses locally:', error);
    return false;
  }
};

// Get expenses from local storage
export const getExpensesLocally = async (): Promise<Expense[]> => {
  try {
    const expensesJson = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
    return expensesJson ? JSON.parse(expensesJson) : [];
  } catch (error) {
    console.error('Error getting expenses locally:', error);
    return [];
  }
};

// Add expense to pending queue (for offline creation)
export const addPendingExpense = async (expense: Expense): Promise<boolean> => {
  try {
    const pending = await getPendingExpenses();
    pending.push({
      ...expense,
      pendingId: `pending_${Date.now()}_${Math.random()}`,
      synced: false,
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_EXPENSES, JSON.stringify(pending));
    return true;
  } catch (error) {
    console.error('Error adding pending expense:', error);
    return false;
  }
};

// Get pending expenses
export const getPendingExpenses = async (): Promise<PendingExpense[]> => {
  try {
    const pendingJson = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_EXPENSES);
    return pendingJson ? JSON.parse(pendingJson) : [];
  } catch (error) {
    console.error('Error getting pending expenses:', error);
    return [];
  }
};

// Remove pending expense after successful sync
export const removePendingExpense = async (pendingId: string): Promise<boolean> => {
  try {
    const pending = await getPendingExpenses();
    const filtered = pending.filter((exp) => exp.pendingId !== pendingId);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_EXPENSES, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing pending expense:', error);
    return false;
  }
};

// Add expense ID to deleted queue (for offline deletion)
export const addDeletedExpense = async (expenseId: string): Promise<boolean> => {
  try {
    const deleted = await getDeletedExpenses();
    if (!deleted.includes(expenseId)) {
      deleted.push(expenseId);
      await AsyncStorage.setItem(STORAGE_KEYS.DELETED_EXPENSES, JSON.stringify(deleted));
    }
    return true;
  } catch (error) {
    console.error('Error adding deleted expense:', error);
    return false;
  }
};

// Get deleted expense IDs
export const getDeletedExpenses = async (): Promise<string[]> => {
  try {
    const deletedJson = await AsyncStorage.getItem(STORAGE_KEYS.DELETED_EXPENSES);
    return deletedJson ? JSON.parse(deletedJson) : [];
  } catch (error) {
    console.error('Error getting deleted expenses:', error);
    return [];
  }
};

// Remove deleted expense ID after successful sync
export const removeDeletedExpense = async (expenseId: string): Promise<boolean> => {
  try {
    const deleted = await getDeletedExpenses();
    const filtered = deleted.filter((id) => id !== expenseId);
    await AsyncStorage.setItem(STORAGE_KEYS.DELETED_EXPENSES, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing deleted expense:', error);
    return false;
  }
};

// Clear all local storage (for logout)
export const clearLocalStorage = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.EXPENSES,
      STORAGE_KEYS.PENDING_EXPENSES,
      STORAGE_KEYS.DELETED_EXPENSES,
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing local storage:', error);
    return false;
  }
};
