import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassAggregations',
  resources: {
    en: {
      tabName: 'Aggregations',
    },
    ja: {
      tabName: '集計',
    },
  },
});
