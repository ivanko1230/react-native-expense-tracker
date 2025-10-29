import React, { useState } from 'react';
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
import { CREATE_EXPENSE } from '../services/graphql';
import { isOnline } from '../utils/networkUtils';
import { addPendingExpense, saveExpensesLocally, getExpensesLocally } from '../services/storageService';

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
];

export default function AddExpenseScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [showCategories, setShowCategories] = useState(false);

  const [createExpense, { loading }] = useMutation(CREATE_EXPENSE, {
    refetchQueries: ['GetExpenses'],
  });

  const handleSave = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const expenseData = {
      amount: amountValue,
      description,
      category,
      date: new Date().toISOString(),
    };

    try {
      const online = await isOnline();
      
      if (online) {
        // Online: Create via GraphQL
        await createExpense({
          variables: expenseData,
        });
        Alert.alert('Success', 'Expense saved!');
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
        
        Alert.alert('Success', 'Expense saved offline (will sync when online)');
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Expense</Text>

      <Text style={styles.label}>Amount *</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={styles.input}
        placeholder="What did you spend on?"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Category</Text>
      <TouchableOpacity
        style={styles.categoryButton}
        onPress={() => setShowCategories(!showCategories)}
      >
        <Text style={styles.categoryButtonText}>{category}</Text>
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
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Expense</Text>
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
});
