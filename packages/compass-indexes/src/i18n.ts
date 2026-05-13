import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassIndexes',
  resources: {
    en: {
      tabName: 'Indexes',
      statsIndexes: 'Indexes: {count}',
      statsTotalSize: 'Total Size: {size}',
      statsAvgSize: 'Avg. Size: {size}',
    },
    ja: {
      tabName: 'インデックス',
      statsIndexes: 'インデックス数: {count}',
      statsTotalSize: '合計サイズ: {size}',
      statsAvgSize: '平均サイズ: {size}',
    },
  },
});
