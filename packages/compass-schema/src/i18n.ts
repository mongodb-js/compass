import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassSchema',
  resources: {
    en: {
      tabName: 'Schema',
    },
    ja: {
      tabName: 'スキーマ',
    },
  },
});
