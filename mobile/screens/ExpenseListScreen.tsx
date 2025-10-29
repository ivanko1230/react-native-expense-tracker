import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GET_EXPENSES, DELETE_EXPENSE } from '../services/graphql';
import { format } from 'date-fns';
import { isOnline, subscribeToNetworkStatus } from '../utils/networkUtils';
import {
  getExpensesLocally,
  saveExpensesLocally,
  addDeletedExpense,
} from '../services/storageService';
import { syncAll } from '../services/syncService';
import FilterModal from '../components/FilterModal';
import LanguageSelector from '../components/LanguageSelector';
import { Expense, ExpenseFilters } from '../types';
import { useTranslation } from 'react-i18next';

type RootStackParamList = {
  Expenses: undefined;
  AddExpense: { expense?: Expense } | undefined;
};

type ExpenseListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Expenses'>;

interface ExpenseListScreenProps {
  navigation: ExpenseListScreenNavigationProp;
}

export default function ExpenseListScreen({ navigation }: ExpenseListScreenProps) {
  const { t, i18n } = useTranslation();
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(true);
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const client = useApolloClient();
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const { data, loading, error, refetch } = useQuery(GET_EXPENSES, {
    skip: !isNetworkOnline,
    fetchPolicy: 'network-only',
    variables: {
      category: filters.category,
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    onCompleted: async (data: any) => {
      if (data?.expenses) {
        await saveExpensesLocally(data.expenses);
      }
    },
  });

  const [deleteExpense] = useMutation(DELETE_EXPENSE, {
    refetchQueries: [{ query: GET_EXPENSES }],
    onError: async (error: any) => {
      // If offline, delete locally
      if (!isNetworkOnline) {
        const localExp = localExpenses.find((e: Expense) => e.id === error.variables?.id);
        if (localExp) {
          await addDeletedExpense(error.variables.id);
          const updated = localExpenses.filter((e: Expense) => e.id !== error.variables.id);
          setLocalExpenses(updated);
          await saveExpensesLocally(updated);
        }
      }
    },
  });

  useEffect(() => {
    checkNetworkAndLoadData();
    const unsubscribe = subscribeToNetworkStatus(async (online: boolean) => {
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

  const checkNetworkAndLoadData = async (): Promise<void> => {
    const online = await isOnline();
    setIsNetworkOnline(online);
    if (!online) {
      loadLocalData();
    }
  };

  const loadLocalData = async (): Promise<void> => {
    const local = await getExpensesLocally();
    setLocalExpenses(local);
  };

  // Apply filters to local expenses when offline
  const getFilteredExpenses = (expenseList: Expense[]): Expense[] => {
    let filtered = expenseList;
    
    if (filters.category) {
      filtered = filtered.filter((exp) => exp.category === filters.category);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(
        (exp) => new Date(exp.date) >= new Date(filters.startDate!)
      );
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(
        (exp) => new Date(exp.date) <= new Date(filters.endDate!)
      );
    }
    
    return filtered;
  };

  const expenses = isNetworkOnline
    ? (data?.expenses || [])
    : getFilteredExpenses(localExpenses);

  const handleDelete = (id: string): void => {
    Alert.alert(t('expenses.deleteExpense'), t('expenses.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            if (isNetworkOnline) {
              await deleteExpense({ variables: { id } });
              Alert.alert(t('common.success'), t('expenses.expenseDeleted'));
            } else {
              // Offline deletion
              await addDeletedExpense(id);
              const updated = expenses.filter((e: Expense) => e.id !== id);
              setLocalExpenses(updated);
              await saveExpensesLocally(updated);
              Alert.alert(t('common.success'), t('expenses.expenseDeletedOffline'));
            }
          } catch (err: any) {
            Alert.alert(t('common.error'), err.message);
          }
        },
      },
    ]);
  };

  const handleEdit = (expense: Expense): void => {
    swipeableRefs.current[expense.id]?.close();
    navigation.navigate('AddExpense', { expense });
  };

  const handleDeleteAction = (id: string): void => {
    swipeableRefs.current[id]?.close();
    handleDelete(id);
  };

  const renderRightActions = (expense: Expense, _progress: Animated.AnimatedInterpolation<number>, _dragX: Animated.AnimatedInterpolation<number>) => {
    return (
      <View style={styles.rightActionContainer}>
        <TouchableOpacity
          style={[styles.editAction, styles.rightAction]}
          onPress={() => handleEdit(expense)}
        >
          <Text style={styles.actionText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteAction, styles.rightAction]}
          onPress={() => handleDeleteAction(expense.id)}
        >
          <Text style={styles.actionText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    );
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
        <Text style={styles.errorText}>{t('expenses.errorLoading')}</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('expenses.title')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageModal(true)}
          >
            <Text style={styles.languageButtonText}>🌐</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>{t('common.filter')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Text style={styles.addButtonText}>{t('expenses.add')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {Object.keys(filters).length > 0 && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersText}>{t('expenses.filtersActive')}</Text>
          <TouchableOpacity onPress={() => setFilters({})}>
            <Text style={styles.clearFiltersText}>{t('common.clear')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <LanguageSelector
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(newFilters: ExpenseFilters) => {
          setFilters(newFilters);
          if (isNetworkOnline) {
            refetch();
          }
        }}
        currentFilters={filters}
      />

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('expenses.noExpenses')}</Text>
          <Text style={styles.emptySubtext}>{t('expenses.addFirstExpense')}</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item: Expense) => item.id}
          renderItem={({ item }: { item: Expense }) => (
            <Swipeable
              ref={(ref: Swipeable | null) => {
                if (ref) {
                  swipeableRefs.current[item.id] = ref;
                }
              }}
              renderRightActions={(progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => renderRightActions(item, progress, dragX)}
              rightThreshold={40}
            >
              <TouchableOpacity
                style={styles.expenseItem}
                onPress={() => handleEdit(item)}
              >
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{item.description}</Text>
                  <View style={styles.expenseMeta}>
                    <Text style={styles.expenseCategory}>{t(`categories.${item.category}`)}</Text>
                    <Text style={styles.expenseDate}>
                      {format(new Date(item.date), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
              </TouchableOpacity>
            </Swipeable>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  languageButtonText: {
    fontSize: 20,
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  filterButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#e8f4f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  rightActionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginVertical: 1,
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  editAction: {
    backgroundColor: '#007AFF',
  },
  deleteAction: {
    backgroundColor: '#ff3b30',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});