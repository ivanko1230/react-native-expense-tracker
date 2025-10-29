import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useQuery } from '@apollo/client';
import { GET_EXPENSES } from '../services/graphql';
import { Expense } from '../types';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export default function MapViewScreen() {
  const { t } = useTranslation();
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const { data, loading, error } = useQuery(GET_EXPENSES, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    // Center map on first expense if available
    if (data?.expenses && data.expenses.length > 0) {
      const expensesWithLocation = data.expenses.filter(
        (exp: Expense) => exp.location?.latitude && exp.location?.longitude
      );
      if (expensesWithLocation.length > 0) {
        const firstExp = expensesWithLocation[0];
        setRegion({
          latitude: firstExp.location!.latitude!,
          longitude: firstExp.location!.longitude!,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    }
  }, [data]);

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
        <Text style={styles.errorText}>{t('map.errorLoading')}</Text>
      </View>
    );
  }

  const expensesWithLocation = (data?.expenses || []).filter(
    (exp: Expense) => exp.location?.latitude && exp.location?.longitude
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('map.title')}</Text>
        <Text style={styles.subtitle}>
          {expensesWithLocation.length} {t('map.expensesWithLocation')}
        </Text>
      </View>

      {expensesWithLocation.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('map.noLocations')}</Text>
          <Text style={styles.emptySubtext}>{t('map.addLocationHint')}</Text>
        </View>
      ) : (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {expensesWithLocation.map((expense: Expense) => (
            <Marker
              key={expense.id}
              coordinate={{
                latitude: expense.location!.latitude!,
                longitude: expense.location!.longitude!,
              }}
              title={expense.description}
              description={`${t(`categories.${expense.category}`)} - $${expense.amount.toFixed(2)}`}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Text style={styles.markerText}>${expense.amount.toFixed(0)}</Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
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
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  map: {
    flex: 1,
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
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff3b30',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    minWidth: 50,
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

