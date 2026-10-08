import { translate } from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';

export const englishTranslate: TranslateFn = (key, english, vars) =>
  translate('en', key, english, vars);

export function makeTranslate(language: string): TranslateFn {
  return (key, english, vars) => translate(language, key, english, vars);
}
