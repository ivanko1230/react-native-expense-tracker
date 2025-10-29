import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_EXPENSES, DELETE_EXPENSE } from '../services/graphql';
import { format } from 'date-fns';
import { isOnline, subscribeToNetworkStatus } from '../utils/networkUtils';
import {
  getExpensesLocally,
  saveExpensesLocally,
  addDeletedExpense,
} from '../services/storageService';
import { syncAll } from '../services/syncService';

export default function ExpenseListScreen({ navigation }) {
  const [isNetworkOnline, setIsNetworkOnline] = useState(true);
  const [localExpenses, setLocalExpenses] = useState([]);
  const client = useApolloClient();

  const { data, loading, error, refetch } = useQuery(GET_EXPENSES, {
    skip: !isNetworkOnline,
    fetchPolicy: 'network-only',
    onCompleted: async (data) => {
      if (data?.expenses) {
        await saveExpensesLocally(data.expenses);
      }
    },
  });

  const [deleteExpense] = useMutation(DELETE_EXPENSE, {
    refetchQueries: [{ query: GET_EXPENSES }],
    onError: async (error) => {
      // If offline, delete locally
      if (!isNetworkOnline) {
        const localExp = localExpenses.find((e) => e.id === error.variables?.id);
        if (localExp) {
          await addDeletedExpense(error.variables.id);
          const updated = localExpenses.filter((e) => e.id !== error.variables.id);
          setLocalExpenses(updated);
          await saveExpensesLocally(updated);
        }
      }
    },
  });

  useEffect(() => {
    checkNetworkAndLoadData();
    const unsubscribe = subscribeToNetworkStatus(async (online) => {
      setIsNetworkOnline(online);
      if (online) {
        await syncAll(client);
        refetch();
      } else {
        loadLocalData();
      }
    });
    return unsubscribe;
  }, []);

  const checkNetworkAndLoadData = async () => {
    const online = await isOnline();
    setIsNetworkOnline(online);
    if (!online) {
      loadLocalData();
    }
  };

  const loadLocalData = async () => {
    const local = await getExpensesLocally();
    setLocalExpenses(local);
  };

  const expenses = isNetworkOnline ? (data?.expenses || []) : localExpenses;

  const handleDelete = (id) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isNetworkOnline) {
              await deleteExpense({ variables: { id } });
              Alert.alert('Success', 'Expense deleted');
            } else {
              // Offline deletion
              await addDeletedExpense(id);
              const updated = expenses.filter((e) => e.id !== id);
              setLocalExpenses(updated);
              await saveExpensesLocally(updated);
              Alert.alert('Success', 'Expense deleted (will sync when online)');
            }
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error loading expenses</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Tap + Add to create your first expense</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.expenseItem}
              onLongPress={() => handleDelete(item.id)}
            >
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDescription}>{item.description}</Text>
                <View style={styles.expenseMeta}>
                  <Text style={styles.expenseCategory}>{item.category}</Text>
                  <Text style={styles.expenseDate}>
                    {format(new Date(item.date), 'MMM dd, yyyy')}
                  </Text>
                </View>
              </View>
              <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
          refreshing={loading}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
