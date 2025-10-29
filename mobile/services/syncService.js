import { isOnline } from '../utils/networkUtils';
import {
  getPendingExpenses,
  removePendingExpense,
  getDeletedExpenses,
  removeDeletedExpense,
  saveExpensesLocally,
} from './storageService';
import { CREATE_EXPENSE, DELETE_EXPENSE } from './graphql';

// Sync pending expenses when online
export const syncPendingExpenses = async (client) => {
  const online = await isOnline();
  if (!online) return { synced: 0, errors: [] };

  const pending = await getPendingExpenses();
  const errors = [];
  let synced = 0;

  for (const expense of pending) {
    try {
      await client.mutate({
        mutation: CREATE_EXPENSE,
        variables: {
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expense.date,
        },
      });
      await removePendingExpense(expense.pendingId);
      synced++;
    } catch (error) {
      errors.push({ expense, error: error.message });
    }
  }

  return { synced, errors };
};

// Sync deleted expenses when online
export const syncDeletedExpenses = async (client) => {
  const online = await isOnline();
  if (!online) return { synced: 0, errors: [] };

  const deleted = await getDeletedExpenses();
  const errors = [];
  let synced = 0;

  for (const expenseId of deleted) {
    try {
      await client.mutate({
        mutation: DELETE_EXPENSE,
        variables: { id: expenseId },
      });
      await removeDeletedExpense(expenseId);
      synced++;
    } catch (error) {
      errors.push({ expenseId, error: error.message });
    }
  }

  return { synced, errors };
};

// Sync all pending operations
export const syncAll = async (client) => {
  const [pendingResult, deletedResult] = await Promise.all([
    syncPendingExpenses(client),
    syncDeletedExpenses(client),
  ]);

  return {
    pending: pendingResult,
    deleted: deletedResult,
    totalSynced: pendingResult.synced + deletedResult.synced,
  };
};
