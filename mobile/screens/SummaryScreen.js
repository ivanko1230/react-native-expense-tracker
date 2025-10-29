import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SummaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Summary</Text>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          Chart will be displayed here
        </Text>
        <Text style={styles.placeholderSubtext}>
          Coming in next commit
        </Text>
      </View>
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
    marginBottom: 20,
    color: '#333',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
  },
});
