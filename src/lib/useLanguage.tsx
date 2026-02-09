'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SupportedLanguage, DEFAULT_LANGUAGE, getCardName, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/data/card-translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  getCardNameTranslated: (cardId: number) => string;
  languageName: string;
  languageFlag: string;
  availableLanguages: SupportedLanguage[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'royalehaus-language';
const AVAILABLE_LANGUAGES: SupportedLanguage[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'ru', 'tr', 'zh'];

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && AVAILABLE_LANGUAGES.includes(stored as SupportedLanguage)) {
          setLanguageState(stored as SupportedLanguage);
        } else {
          // Try to detect browser language
          const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
          if (AVAILABLE_LANGUAGES.includes(browserLang)) {
            setLanguageState(browserLang);
          }
        }
      } catch (e) {
        console.error('Error loading language preference:', e);
      }
      setIsHydrated(true);
    }
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
        // Dispatch event for other components/tabs to sync
        window.dispatchEvent(new CustomEvent('language-changed', { detail: lang }));
      } catch (e) {
        console.error('Error saving language preference:', e);
      }
    }
  }, []);

  // Listen for language changes from other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newLang = e.newValue as SupportedLanguage;
        if (AVAILABLE_LANGUAGES.includes(newLang)) {
          setLanguageState(newLang);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Memoized card name getter
  const getCardNameTranslated = useCallback((cardId: number): string => {
    return getCardName(cardId, language);
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    getCardNameTranslated,
    languageName: LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en,
    languageFlag: LANGUAGE_FLAGS[language] || LANGUAGE_FLAGS.en,
    availableLanguages: AVAILABLE_LANGUAGES,
  };

  // Avoid hydration mismatch by not rendering until client-side
  if (!isHydrated) {
    return (
      <LanguageContext.Provider value={{ ...value, language: DEFAULT_LANGUAGE }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Standalone hook for getting translated card name (for use outside provider)
export function useCardName(cardId: number): string {
  const { getCardNameTranslated } = useLanguage();
  return getCardNameTranslated(cardId);
}

export { AVAILABLE_LANGUAGES };
export type { SupportedLanguage };
