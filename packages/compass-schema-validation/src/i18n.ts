import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassSchemaValidation',
  resources: {
    en: {
      tabName: 'Validation',
    },
    ja: {
      tabName: 'バリデーション',
    },
  },
});
