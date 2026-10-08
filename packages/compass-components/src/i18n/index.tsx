import React, { createContext, useCallback, useContext } from 'react';
import { CATALOGS } from './translations';

export const DEFAULT_LANGUAGE = 'en';

export type TranslateVars = Record<string, string | number>;
export type TranslateFn = (
  key: string,
  english: string,
  vars?: TranslateVars
) => string;

const LanguageContext = createContext<string>(DEFAULT_LANGUAGE);

/**
 * Looks up `key` in the catalog of `language` and falls back to the English
 * source text. `{name}` placeholders are replaced with the matching `vars`.
 */
export function translate(
  language: string,
  key: string,
  english: string,
  vars?: TranslateVars
): string {
  const text = CATALOGS[language]?.[key] ?? english;
  if (!vars) {
    return text;
  }
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

export const LanguageProvider: React.FunctionComponent<{
  language?: string;
  children?: React.ReactNode;
}> = ({ language = DEFAULT_LANGUAGE, children }) => {
  return (
    <LanguageContext.Provider value={language}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): string {
  return useContext(LanguageContext);
}

/**
 * Returns a translate function bound to the current language. Texts that
 * contain dynamic values use `{name}` placeholders:
 * `t('crud.documents', '{count} documents', { count })`.
 */
export function useTranslation(): TranslateFn {
  const language = useLanguage();
  return useCallback(
    (key, english, vars) => translate(language, key, english, vars),
    [language]
  );
}

/**
 * Component form of `useTranslation` for places where a hook can't be used,
 * e.g. static JSX stored in module-level objects.
 */
export const Translated: React.FunctionComponent<{
  id: string;
  children: string;
}> = ({ id, children }) => {
  const t = useTranslation();
  return <>{t(id, children)}</>;
};
