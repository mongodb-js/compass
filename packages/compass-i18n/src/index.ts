import i18next from 'i18next';
import ICU from 'i18next-icu';
import React, { useEffect } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { usePreference } from 'compass-preferences-model/provider';

export function createPluginI18n<T extends Record<string, string>>(options: {
  namespace: string;
  resources: Record<string, T>;
}): {
  i18n: typeof i18next;
  I18nProvider: React.FC<{ children: React.ReactNode }>;
  initLanguage: (language: string) => void;
} {
  const { namespace, resources } = options;

  const i18n = i18next.createInstance();

  void i18n
    .use(ICU)
    .use(initReactI18next)
    .init({
      resources: Object.fromEntries(
        Object.entries(resources).map(([lng, translations]) => [
          lng,
          { [namespace]: translations },
        ])
      ),
      lng: 'en',
      fallbackLng: 'en',
      ns: [namespace],
      defaultNS: namespace,
      interpolation: { escapeValue: false },
    });

  function I18nProvider({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement {
    const language = usePreference('language');
    useEffect(() => {
      void i18n.changeLanguage(language);
    }, [language]);
    return React.createElement(I18nextProvider, { i18n }, children);
  }

  function initLanguage(language: string): void {
    void i18n.changeLanguage(language);
  }

  return { i18n, I18nProvider, initLanguage };
}
