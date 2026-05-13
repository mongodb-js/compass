import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassQueryBar',
  resources: {
    en: {
      // query-bar buttons
      explainButton: 'Explain',
      explainButtonAriaLabel: 'Explain query',
      explainButtonTitle: 'View the execution plan for the current query',
      resetButton: 'Reset',
      resetButtonAriaLabel: 'Reset query',
      applyButton: 'Apply',
      // query-option labels
      optionLabelFilter: 'Filter',
      optionLabelProject: 'Project',
      optionLabelSort: 'Sort',
      optionLabelHint: 'Index Hint',
      optionLabelCollation: 'Collation',
      optionLabelSkip: 'Skip',
      optionLabelLimit: 'Limit',
      optionLabelMaxTimeMS: 'Max Time MS',
      // query-option placeholders
      optionPlaceholderFilter: "Type a query: { field: 'value' }",
      optionPlaceholderProject: '{ field: 0 }',
      optionPlaceholderSort: "{ field: -1 } or [['field', -1]]",
      optionPlaceholderHint: '{ field: -1 } or "indexName"',
      optionPlaceholderCollation: "{ locale: 'simple' }",
      optionPlaceholderSkip: '0',
      optionPlaceholderLimit: '0',
      optionPlaceholderMaxTimeMS: '60000',
      // query-option tooltips
      maxTimeMSWebLimitTooltip:
        'Operations longer than 5 minutes are not supported in the web environment',
      // options toggle
      optionsToggleLabel: 'Options',
      optionsToggleMoreAriaLabel: 'More Options',
      optionsToggleLessAriaLabel: 'Fewer Options',
      // AI entry
      generateQueryLabel: 'Generate query',
    },
    ja: {
      // query-bar buttons
      explainButton: '実行計画',
      explainButtonAriaLabel: 'クエリを説明',
      explainButtonTitle: '現在のクエリの実行計画を表示',
      resetButton: 'リセット',
      resetButtonAriaLabel: 'クエリをリセット',
      applyButton: '適用',
      // query-option labels
      optionLabelFilter: 'フィルター',
      optionLabelProject: '射影',
      optionLabelSort: 'ソート',
      optionLabelHint: 'インデックスヒント',
      optionLabelCollation: '照合順序',
      optionLabelSkip: 'スキップ',
      optionLabelLimit: '上限',
      optionLabelMaxTimeMS: '最大実行時間（ミリ秒）',
      // query-option placeholders
      optionPlaceholderFilter: "クエリを入力: { field: 'value' }",
      optionPlaceholderProject: '{ field: 0 }',
      optionPlaceholderSort: "{ field: -1 } or [['field', -1]]",
      optionPlaceholderHint: '{ field: -1 } or "indexName"',
      optionPlaceholderCollation: "{ locale: 'simple' }",
      optionPlaceholderSkip: '0',
      optionPlaceholderLimit: '0',
      optionPlaceholderMaxTimeMS: '60000',
      // query-option tooltips
      maxTimeMSWebLimitTooltip:
        'Web環境では5分を超える操作はサポートされていません',
      // options toggle
      optionsToggleLabel: 'オプション',
      optionsToggleMoreAriaLabel: 'オプションを表示',
      optionsToggleLessAriaLabel: 'オプションを隠す',
      // AI entry
      generateQueryLabel: 'クエリを生成',
    },
  },
});
