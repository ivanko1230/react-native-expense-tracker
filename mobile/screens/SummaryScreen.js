import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@apollo/client';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { GET_MONTHLY_SUMMARY } from '../services/graphql';
import { format, subMonths, addMonths } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  decimalPlaces: 0,
};

const COLORS = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#FF2D55',
  '#5856D6',
  '#FFCC00',
  '#8E8E93',
];

export default function SummaryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth() + 1;

  const { data, loading, error, refetch } = useQuery(GET_MONTHLY_SUMMARY, {
    variables: {
      year: currentYear,
      month: currentMonth,
    },
  });

  const summary = data?.monthlySummary || [];
  const totalExpenses = summary.reduce((sum, item) => sum + item.total, 0);

  const handlePreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1));
  };

  const pieChartData = summary.map((item, index) => ({
    name: item.category,
    total: item.total,
    color: COLORS[index % COLORS.length],
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  const barChartData = {
    labels: summary.map((item) => item.category.substring(0, 6)),
    datasets: [
      {
        data: summary.map((item) => item.total),
      },
    ],
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
        <Text style={styles.errorText}>Error loading summary</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Summary</Text>
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={handlePreviousMonth}>
            <Text style={styles.dateButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>
            {format(selectedDate, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <Text style={styles.dateButton}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {summary.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No expenses for this month</Text>
        </View>
      ) : (
        <>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Expenses</Text>
            <Text style={styles.totalAmount}>${totalExpenses.toFixed(2)}</Text>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>By Category (Pie Chart)</Text>
            {pieChartData.length > 0 && (
              <PieChart
                data={pieChartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor="total"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                absolute
              />
            )}
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>By Category (Bar Chart)</Text>
            {barChartData.labels.length > 0 && (
              <BarChart
                data={barChartData}
                width={screenWidth - 40}
                height={220}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={chartConfig}
                verticalLabelRotation={30}
                showValuesOnTopOfBars
                fromZero
              />
            )}
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Category Breakdown</Text>
            {summary.map((item, index) => (
              <View key={item.category} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: COLORS[index % COLORS.length] },
                    ]}
                  />
                  <Text style={styles.listItemCategory}>{item.category}</Text>
                </View>
                <View style={styles.listItemRight}>
                  <Text style={styles.listItemAmount}>
                    ${item.total.toFixed(2)}
                  </Text>
                  <Text style={styles.listItemCount}>({item.count})</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  dateButton: {
    fontSize: 24,
    color: '#007AFF',
    paddingHorizontal: 15,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 150,
    textAlign: 'center',
  },
  totalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    marginTop: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  listContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 10,
    marginBottom: 40,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  listItemCategory: {
    fontSize: 16,
    color: '#333',
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  listItemCount: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
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
