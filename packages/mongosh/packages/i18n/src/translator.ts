/* eslint-disable camelcase */
import { MongoshInternalError } from '@mongosh/errors';
import Mustache from 'mustache';
import type Catalog from './catalog';
import de_DE from './locales/de_DE';
import en_US from './locales/en_US';

/**
 * The default locale.
 */
const DEFAULT_LOCALE = 'en_US';

/**
 * Locale mappings.
 */
const MAPPINGS: Record<string, Catalog> = {
  'en_US': en_US,
  'de_DE': de_DE
};

/**
 * The help template.
 */
const TEMPLATE = '{{description}}\n\n' +
  '{{link}}\n\n' +
  '{{example}}\n\n' +
  '{{returns}}';

/**
 * The translator class.
 */
class Translator {
  private locale: string = DEFAULT_LOCALE;
  private catalog: Catalog;

  /**
   * Translate the key.
   *
   * @param {string} key - The key.
   *
   * @returns {string} The translation.
   */
  __(key: string): string {
    const translation = this.translate(key);
    if (translation === undefined) {
      throw new MongoshInternalError(`Could not translate key ${JSON.stringify(key)}`);
    }
    return translation;
  }

  /**
   * Instantiate the catalog.
   *
   * @param {Catalog} catalog - The optional catalog.
   */
  constructor(catalog?: Catalog) {
    if (catalog) {
      this.catalog = catalog;
    } else {
      this.catalog = MAPPINGS[this.locale];
    }
  }

  /**
   * Set the current locale.
   *
   * @param {string} locale - The locale.
   */
  setLocale(locale: string): void {
    if (MAPPINGS.hasOwnProperty(locale)) {
      this.locale = locale;
      this.catalog = MAPPINGS[locale];
    } else {
      this.locale = DEFAULT_LOCALE;
      this.catalog = MAPPINGS[DEFAULT_LOCALE];
    }
  }

  /**
   * Get the translation for the provided key.
   *
   * @param {string} key - The key.
   *
   * @returns {string} The translation.
   */
  translate(key: string): string | undefined {
    return this.find(key);
  }

  /**
   * Translate the key into API help.
   *
   * @param {string} key - The key.
   *
   * @returns {string} The translated string.
   */
  translateApiHelp(key: string): string | undefined {
    const value = this.find(key);
    if (!value) {
      return;
    }

    if (typeof value === 'string') {
      return value;
    }
    return Mustache.render(TEMPLATE, value);
  }

  private find(key: string): string | undefined {
    return key.split('.').reduce((a: any, b: string) => {
      return a ? a[b] : undefined;
    }, this.catalog);
  }
}

export default Translator;
