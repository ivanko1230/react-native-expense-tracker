import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ApolloProvider } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { initializeI18n } from './services/i18n';
import apolloClient from './services/apolloClient';
import LoginScreen from './screens/LoginScreen';
import ExpenseListScreen from './screens/ExpenseListScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import SummaryScreen from './screens/SummaryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Expenses"
        component={ExpenseListScreen}
        options={{
          tabBarLabel: t('tabs.expenses'),
        }}
      />
      <Tab.Screen
        name="Summary"
        component={SummaryScreen}
        options={{
          tabBarLabel: t('tabs.summary'),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [i18nInitialized, setI18nInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      await initializeI18n();
      setI18nInitialized(true);
      checkAuth();
    };
    initialize();
  }, []);

  const checkAuth = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!i18nInitialized || loading) {
    return null; // Or a loading screen
  }

  return (
    <ApolloProvider client={apolloClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login">
              {(props: any) => (
                <LoginScreen
                  {...props}
                  onLogin={() => setIsAuthenticated(true)}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="AddExpense"
                component={AddExpenseScreen}
                options={{
                  presentation: 'modal',
                  headerShown: true,
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}
