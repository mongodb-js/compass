import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassCrud',
  resources: {
    en: {
      tabName: 'Documents',
      statsDocuments: 'Documents: {count}',
      statsStorageSize: 'Storage Size: {size}',
      statsAvgSize: 'Avg. Size: {size}',
      // crud-toolbar - dropdown actions
      exportQueryResults: 'Export query results',
      exportFullCollection: 'Export the full collection',
      expandAllDocuments: 'Expand all documents',
      collapseAllDocuments: 'Collapse all documents',
      // crud-toolbar - context menu items
      contextMenuImportFile: 'Import JSON or CSV file',
      contextMenuInsertDocument: 'Insert document...',
      contextMenuExportQueryResults: 'Export query results...',
      contextMenuExportFullCollection: 'Export full collection...',
      contextMenuBulkUpdate: 'Bulk update',
      contextMenuBulkDelete: 'Bulk delete',
      contextMenuRefresh: 'Refresh',
      // crud-toolbar - warnings and errors
      outdatedWarning:
        'The content is outdated and no longer in sync with the current query. Press "Find" again to see the results for the current query.',
      operationTimedOutHint:
        'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the expanded filter options.',
      countUnavailableTooltip:
        'The count is not available for this query. This can happen when the count operation fails or exceeds the maxTimeMS of {maxTimeMS}.',
      // crud-toolbar - query bar
      queryBarFindButton: 'Find',
      // crud-toolbar - atlas skills banner
      atlasSkillsBannerCta:
        'Practice creating, reading, updating, and deleting documents efficiently.',
      // crud-toolbar - buttons and menus
      addDataButton: 'Add data',
      addDataInsertDocument: 'Insert document',
      addDataGenerateMockData: 'Generate mock data script',
      updateButton: 'Update',
      deleteButton: 'Delete',
      updateMenuDisabledTooltip:
        'Remove limit and skip in your query to perform an update',
      deleteMenuDisabledTooltip:
        'Remove limit and skip in your query to perform a delete',
      exportDataButton: 'Export Data',
      exportToLanguageTitle: 'Export query to language',
      exportCodeButton: 'Export Code',
      // crud-toolbar - aria labels and titles
      docsPerPageAriaLabel: 'Update number of documents per page',
      countOf: 'of',
      countUnavailable: 'N/A',
      fetchingDocumentCount: 'Fetching document count…',
      refreshDocumentsLabel: 'Refresh documents',
      previousPageLabel: 'Previous Page',
      nextPageLabel: 'Next Page',
      outputOptionsLabel: 'Output Options',
    },
    ja: {
      tabName: 'ドキュメント',
      statsDocuments: 'ドキュメント数: {count}',
      statsStorageSize: 'ストレージサイズ: {size}',
      statsAvgSize: '平均サイズ: {size}',
      // crud-toolbar - dropdown actions
      exportQueryResults: 'クエリ結果をエクスポート',
      exportFullCollection: 'コレクション全体をエクスポート',
      expandAllDocuments: 'すべてのドキュメントを展開',
      collapseAllDocuments: 'すべてのドキュメントを折りたたむ',
      // crud-toolbar - context menu items
      contextMenuImportFile: 'JSONまたはCSVファイルをインポート',
      contextMenuInsertDocument: 'ドキュメントを挿入...',
      contextMenuExportQueryResults: 'クエリ結果をエクスポート...',
      contextMenuExportFullCollection: 'コレクション全体をエクスポート...',
      contextMenuBulkUpdate: '一括更新',
      contextMenuBulkDelete: '一括削除',
      contextMenuRefresh: '更新',
      // crud-toolbar - warnings and errors
      outdatedWarning:
        'コンテンツが古く、現在のクエリと同期していません。現在のクエリの結果を表示するには、「検索」を再度押してください。',
      operationTimedOutHint:
        '操作が時間制限を超えました。拡張フィルターオプションでクエリのmaxTimeMSを増やすことを検討してください。',
      countUnavailableTooltip:
        'このクエリではカウントが利用できません。カウント操作が失敗するか、maxTimeMSの{maxTimeMS}を超えた場合に発生することがあります。',
      // crud-toolbar - query bar
      queryBarFindButton: '検索',
      // crud-toolbar - atlas skills banner
      atlasSkillsBannerCta:
        'ドキュメントの作成、読み取り、更新、削除を効率的に実践してください。',
      // crud-toolbar - buttons and menus
      addDataButton: 'データを追加',
      addDataInsertDocument: 'ドキュメントを挿入',
      addDataGenerateMockData: 'モックデータスクリプトを生成',
      updateButton: '更新',
      deleteButton: '削除',
      updateMenuDisabledTooltip:
        'クエリのlimitとskipを削除して更新を実行してください',
      deleteMenuDisabledTooltip:
        'クエリのlimitとskipを削除して削除を実行してください',
      exportDataButton: 'データをエクスポート',
      exportToLanguageTitle: 'クエリを言語にエクスポート',
      exportCodeButton: 'コードをエクスポート',
      // crud-toolbar - aria labels and titles
      docsPerPageAriaLabel: '1ページあたりのドキュメント数を更新',
      countOf: 'の',
      countUnavailable: 'N/A',
      fetchingDocumentCount: 'ドキュメント数を取得中…',
      refreshDocumentsLabel: 'ドキュメントを更新',
      previousPageLabel: '前のページ',
      nextPageLabel: '次のページ',
      outputOptionsLabel: '出力オプション',
    },
  },
});
