import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassSidebar',
  resources: {
    en: {
      // sidebar-header
      title: 'Compass',
      dataExplorerTitle: 'Data Explorer',
      compassSettings: 'Compass Settings',
      // copy connection string toasts
      copySuccessTitle: 'Success',
      copySuccessDescription: 'Copied to clipboard.',
      copyErrorTitle: 'Error',
      copyErrorDescription:
        'An error occurred when copying to clipboard. Please try again.',
      // navigation items
      myQueries: 'My Queries',
      dataModeling: 'Data Modeling',
      // connections list header
      connections: 'Connections',
      clusters: 'Clusters',
      searchConnections: 'Search connections',
      searchClusters: 'Search clusters',
      collapseAllConnections: 'Collapse all connections',
      addNewConnection: 'Add new connection',
      importConnections: 'Import connections',
      exportConnections: 'Export connections',
      // connections list body
      noResultsFound: 'No results found.',
      noDeployments: 'You have not connected to any deployments.',
    },
    ja: {
      // sidebar-header
      title: 'Compass',
      dataExplorerTitle: 'データエクスプローラー',
      compassSettings: 'Compass 設定',
      // copy connection string toasts
      copySuccessTitle: '成功',
      copySuccessDescription: 'クリップボードにコピーしました。',
      copyErrorTitle: 'エラー',
      copyErrorDescription:
        'クリップボードへのコピー中にエラーが発生しました。もう一度お試しください。',
      // navigation items
      myQueries: 'マイクエリ',
      dataModeling: 'データモデリング',
      // connections list header
      connections: '接続',
      clusters: 'クラスター',
      searchConnections: '接続を検索',
      searchClusters: 'クラスターを検索',
      collapseAllConnections: 'すべての接続を折りたたむ',
      addNewConnection: '新しい接続を追加',
      importConnections: '接続をインポート',
      exportConnections: '接続をエクスポート',
      // connections list body
      noResultsFound: '結果が見つかりませんでした。',
      noDeployments: 'デプロイメントに接続していません。',
    },
  },
});
