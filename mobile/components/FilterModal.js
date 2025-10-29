import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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

export default function FilterModal({ visible, onClose, onApply, currentFilters }) {
  const [selectedCategory, setSelectedCategory] = useState(currentFilters?.category || '');
  const [startDate, setStartDate] = useState(
    currentFilters?.startDate ? new Date(currentFilters.startDate) : startOfMonth(new Date())
  );
  const [endDate, setEndDate] = useState(
    currentFilters?.endDate ? new Date(currentFilters.endDate) : endOfMonth(new Date())
  );

  const handleApply = () => {
    onApply({
      category: selectedCategory || undefined,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedCategory('');
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
    onApply({
      category: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Filter Expenses</Text>

          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    !selectedCategory && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      !selectedCategory && styles.categoryButtonTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === category && styles.categoryButtonTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <Text style={styles.dateText}>
                {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
              </Text>
              <Text style={styles.dateHint}>
                Note: Full date picker implementation would require additional libraries
              </Text>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  scrollView: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  dateHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginRight: 10,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
