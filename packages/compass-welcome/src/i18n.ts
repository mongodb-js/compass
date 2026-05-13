import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassWelcome',
  resources: {
    en: {
      // desktop-welcome-tab
      welcomeTitle: 'Welcome to MongoDB Compass',
      connectPrompt: 'To get started, connect to an existing server or',
      addNewConnection: 'Add new connection',
      atlasNoClusterTitle: "New to Compass and don't have a cluster?",
      atlasDescription:
        "If you don't already have a cluster, you can create one for free using <atlasLink>MongoDB Atlas</atlasLink>",
      atlasCreateCluster: 'CREATE FREE CLUSTER',
      // plugin-tab-title
      workspaceName: 'Welcome',
      // connection-list
      connectedTo: 'Connected to {connectionName}',
      failedToConnectTo: 'Failed to connect to {connectionName}',
      connectingTo: 'Connecting to {connectionName}',
      // welcome-modal
      modalTitle: 'Welcome to Compass',
      modalBody:
        'Build aggregation pipelines, optimize queries, analyze schemas, and more. All with the GUI built by - and for - MongoDB.',
      modalStart: 'Start',
      modalDisclaimerPrivacy:
        "To help improve our products, anonymous usage data is collected and sent to MongoDB in accordance with MongoDB's privacy policy.",
      modalDisclaimerSettings:
        'Manage this behavior on the Compass <settingsLink>Settings</settingsLink> page.',
    },
    ja: {
      // desktop-welcome-tab
      welcomeTitle: 'MongoDB Compass へようこそ',
      connectPrompt: '始めるには、既存のサーバーに接続するか、',
      addNewConnection: '新しい接続を追加',
      atlasNoClusterTitle:
        'Compass が初めてで、クラスターをお持ちでないですか？',
      atlasDescription:
        'クラスターをお持ちでない場合は、<atlasLink>MongoDB Atlas</atlasLink> を使用して無料で作成できます',
      atlasCreateCluster: '無料クラスターを作成',
      // plugin-tab-title
      workspaceName: 'ようこそ',
      // connection-list
      connectedTo: '{connectionName} に接続しました',
      failedToConnectTo: '{connectionName} への接続に失敗しました',
      connectingTo: '{connectionName} に接続中',
      // welcome-modal
      modalTitle: 'Compass へようこそ',
      modalBody:
        '集計パイプラインの構築、クエリの最適化、スキーマの分析など。MongoDB が MongoDB のために構築した GUI でこれらをすべて実現できます。',
      modalStart: '開始',
      modalDisclaimerPrivacy:
        '製品改善のため、匿名の使用状況データが MongoDB のプライバシーポリシーに基づいて収集され、MongoDB に送信されます。',
      modalDisclaimerSettings:
        'この動作は Compass の<settingsLink>設定</settingsLink>ページで管理できます。',
    },
  },
});
