// @ts-nocheck
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import en from './translations/en.json';
import tr from './translations/tr.json';
import de from './translations/de.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  de: { translation: de },
};

const initI18n = async () => {
  let savedLanguage = 'en';
  
  // Only attempt to get saved language if we're not in a Node/SSR environment
  if (typeof window !== 'undefined' || Platform.OS !== 'web') {
    try {
      const persistedLanguage = await AsyncStorage.getItem('user-language');
      if (persistedLanguage) {
        savedLanguage = persistedLanguage;
      } else {
        const locales = Localization.getLocales();
        savedLanguage = locales && locales.length > 0 ? locales[0].languageCode : 'en';
      }
    } catch (e) {
      console.log('i18n: Error accessing storage or localization', e);
    }
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage || 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v3',
    });
};

initI18n();

export default i18n;
