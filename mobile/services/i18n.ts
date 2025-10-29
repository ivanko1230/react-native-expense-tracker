import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import nl from '../locales/nl.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

export const supportedLanguages = ['en', 'es', 'fr', 'de', 'nl'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  nl: { translation: nl },
};

const getInitialLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && supportedLanguages.includes(savedLanguage as SupportedLanguage)) {
      return savedLanguage;
    }
    
    // Try to match device locale
    const deviceLocale = Localization.locale.split('-')[0];
    if (supportedLanguages.includes(deviceLocale as SupportedLanguage)) {
      return deviceLocale;
    }
    
    return 'en'; // Default to English
  } catch (error) {
    console.error('Error getting initial language:', error);
    return 'en';
  }
};

export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export const initializeI18n = async (): Promise<void> => {
  const initialLanguage = await getInitialLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

export default i18n;

