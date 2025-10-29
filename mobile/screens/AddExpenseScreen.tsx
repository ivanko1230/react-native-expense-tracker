import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMutation } from '@apollo/client';
import { CREATE_EXPENSE, UPDATE_EXPENSE } from '../services/graphql';
import { isOnline } from '../utils/networkUtils';
import { addPendingExpense, saveExpensesLocally, getExpensesLocally } from '../services/storageService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, Expense, ExpenseLocation } from '../types';
import * as Location from 'expo-location';

type AddExpenseScreenProps = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Other',
] as const;

export default function AddExpenseScreen({ navigation, route }: AddExpenseScreenProps) {
  const { t } = useTranslation();
  const expense = route.params?.expense;
  const isEditing = !!expense;
  
  const [amount, setAmount] = useState<string>(expense ? expense.amount.toString() : '');
  const [description, setDescription] = useState<string>(expense ? expense.description : '');
  const [category, setCategory] = useState<string>(expense ? expense.category : 'Other');
  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [location, setLocation] = useState<ExpenseLocation | null>(
    expense?.location || null
  );
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? t('addExpense.editTitle') : t('addExpense.title'),
    });
  }, [navigation, t, isEditing]);

  const [createExpense, { loading: createLoading }] = useMutation(CREATE_EXPENSE, {
    refetchQueries: ['GetExpenses'],
  });

  const [updateExpense, { loading: updateLoading }] = useMutation(UPDATE_EXPENSE, {
    refetchQueries: ['GetExpenses'],
  });

  const loading = createLoading || updateLoading;

  const captureLocation = async (): Promise<void> => {
    try {
      setLocationLoading(true);
      
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('addExpense.locationPermissionDenied'));
        setLocationLoading(false);
        return;
      }

      // Get current location
      const locationData = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = locationData.coords;

      // Try to reverse geocode to get address
      let address: string | undefined;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (reverseGeocode && reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = [
            addr.street,
            addr.city,
            addr.region,
            addr.country,
          ]
            .filter(Boolean)
            .join(', ');
        }
      } catch (error) {
        // Ignore reverse geocoding errors
        console.log('Reverse geocoding failed:', error);
      }

      setLocation({
        latitude,
        longitude,
        address,
      });
      Alert.alert(t('common.success'), t('addExpense.locationCaptured'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('addExpense.locationError'));
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!amount || !description) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert(t('common.error'), t('addExpense.validAmount'));
      return;
    }

    const expenseData: any = {
      amount: amountValue,
      description,
      category,
      date: isEditing && expense ? expense.date : new Date().toISOString(),
    };

    if (location) {
      expenseData.location = location;
    }

    try {
      const online = await isOnline();
      
      if (isEditing && expense) {
        // Editing existing expense
        if (online) {
          await updateExpense({
            variables: {
              id: expense.id,
              ...expenseData,
            },
          });
          Alert.alert(t('common.success'), t('addExpense.expenseUpdated'));
        } else {
          // Offline edit - for now, show error
          Alert.alert(t('common.error'), 'Editing expenses offline is not yet supported');
          return;
        }
      } else {
        // Creating new expense
        if (online) {
          await createExpense({
            variables: expenseData,
          });
          Alert.alert(t('common.success'), t('addExpense.expenseSaved'));
        } else {
          // Offline: Save locally and add to pending queue
          const tempId = `temp_${Date.now()}`;
          const localExpense = {
            id: tempId,
            ...expenseData,
          };
          
          await addPendingExpense(localExpense);
          const local = await getExpensesLocally();
          local.push(localExpense);
          await saveExpensesLocally(local);
          
          Alert.alert(t('common.success'), t('addExpense.expenseSavedOffline'));
        }
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  return (
    <View style={styles.container}>
      {!isEditing && <Text style={styles.title}>{t('addExpense.title')}</Text>}

      <Text style={styles.label}>{t('addExpense.amountRequired')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('addExpense.amountPlaceholder')}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>{t('addExpense.descriptionRequired')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('addExpense.descriptionPlaceholder')}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>{t('addExpense.category')}</Text>
      <TouchableOpacity
        style={styles.categoryButton}
        onPress={() => setShowCategories(!showCategories)}
      >
        <Text style={styles.categoryButtonText}>{t(`categories.${category}`)}</Text>
        <Text style={styles.arrow}>{showCategories ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showCategories && (
        <View style={styles.categoriesList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryItem,
                category === cat && styles.categoryItemSelected,
              ]}
              onPress={() => {
                setCategory(cat);
                setShowCategories(false);
              }}
            >
              <Text
                style={[
                  styles.categoryItemText,
                  category === cat && styles.categoryItemTextSelected,
                ]}
              >
                {t(`categories.${cat}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>{t('addExpense.location')}</Text>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={captureLocation}
        disabled={locationLoading}
      >
        {locationLoading ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <>
            <Text style={styles.locationButtonText}>
              {location
                ? t('addExpense.locationCaptured') + (location.address ? ` - ${location.address}` : '')
                : t('addExpense.captureLocation')}
            </Text>
            {location && (
              <TouchableOpacity
                onPress={() => setLocation(null)}
                style={styles.removeLocationButton}
              >
                <Text style={styles.removeLocationText}>✕</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditing ? t('addExpense.updateExpense') : t('addExpense.saveExpense')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  categoriesList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryItemSelected: {
    backgroundColor: '#007AFF',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  categoryItemTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
      saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
      },
      locationButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
      },
      locationButtonText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
      },
      removeLocationButton: {
        marginLeft: 10,
        padding: 5,
      },
      removeLocationText: {
        fontSize: 18,
        color: '#ff3b30',
        fontWeight: 'bold',
      },
    });

