import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassSettings',
  resources: {
    en: {
      // modal
      modalTitle: 'Settings',
      submitButton: 'Save',
      // tab names
      tabGeneral: 'General',
      tabTheme: 'Theme',
      tabPrivacy: 'Privacy',
      tabProxy: 'Proxy Configuration',
      tabOidc: 'OIDC',
      tabAi: 'Artificial Intelligence',
      tabFeaturePreview: 'Feature Preview',
      // general
      generalIntro:
        'To enhance the user experience, Compass can enable or disable particular features. Please choose from the settings below:',
      // theme
      themeIntro: 'Change the appearance of Compass.',
      themeSyncWithOS: 'Sync with OS',
      themeSyncWithOSDescription:
        'Automatically switch between light and dark themes based on your OS settings',
      themeLight: 'Light Theme',
      themeDark: 'Dark Theme',
      // privacy
      privacyIntro:
        'To enhance the user experience, Compass can integrate with 3rd party services, which requires external network requests. Please choose from the settings below:',
      privacyOutro:
        'With any of these options, none of your personal information or stored data will be submitted.',
      privacyLearnMore: 'Learn more:',
      privacyPolicy: 'MongoDB Privacy Policy',
      // proxy
      proxyNone: 'No Proxy',
      proxySystem: 'System Proxy',
      proxyCustom: 'Manual Configuration',
      proxyExcludedHosts: 'Excluded hosts',
      proxyExcludedHostsDescription:
        'Comma-separated list of hostnames and IP addresses. Connections to these hosts will not be forwarded through the proxy.',
      // proxy custom
      proxyUrl: 'Proxy URL',
      proxyUrlDescription:
        'Specify a <code>http://</code>, <code>https://</code>, <code>socks5://</code> or <code>pac+https://</code> URL.',
      proxyUsername: 'Username',
      proxyPassword: 'Password',
      proxyAuthWarning:
        'Some resources, such as map data for geographic visualizations, cannot currently be loaded through proxies which require authentication.',
      // oidc
      oidcIntro:
        'Change the behavior of the OIDC authentication mechanism for server connection and Atlas Login in Compass.',
      oidcServerOptionsTitle: 'MongoDB server OIDC Authentication options',
      // gen-ai
      genAiIntro: 'Provides access to advanced generative AI capabilities.',
      // feature preview
      featurePreviewIntro:
        'These settings control experimental behavior of Compass. Use them at your own risk!',
      // state labels
      stateSetCli:
        'This setting cannot be modified as it has been set at Compass startup.',
      stateSetGlobal:
        'This setting cannot be modified as it has been set in the global Compass configuration file.',
      stateHardcoded:
        'This setting cannot be modified as it is disabled for this Compass edition.',
      stateDerived:
        'This setting cannot be modified as its value is implied by another option.',
    },
    ja: {
      // modal
      modalTitle: '設定',
      submitButton: '保存',
      // tab names
      tabGeneral: '一般',
      tabTheme: 'テーマ',
      tabPrivacy: 'プライバシー',
      tabProxy: 'プロキシ構成',
      tabOidc: 'OIDC',
      tabAi: '人工知能',
      tabFeaturePreview: '機能プレビュー',
      // general
      generalIntro:
        'ユーザーエクスペリエンスを向上させるために、Compass は特定の機能を有効または無効にできます。以下の設定からお選びください:',
      // theme
      themeIntro: 'Compass の外観を変更します。',
      themeSyncWithOS: 'OS と同期',
      themeSyncWithOSDescription:
        'OS の設定に基づいてライトテーマとダークテーマを自動的に切り替えます',
      themeLight: 'ライトテーマ',
      themeDark: 'ダークテーマ',
      // privacy
      privacyIntro:
        'ユーザーエクスペリエンスを向上させるために、Compass はサードパーティのサービスと統合できますが、これには外部ネットワークリクエストが必要です。以下の設定からお選びください:',
      privacyOutro:
        'これらのいずれのオプションでも、個人情報や保存されたデータは送信されません。',
      privacyLearnMore: '詳細はこちら:',
      privacyPolicy: 'MongoDB プライバシーポリシー',
      // proxy
      proxyNone: 'プロキシなし',
      proxySystem: 'システムプロキシ',
      proxyCustom: '手動構成',
      proxyExcludedHosts: '除外するホスト',
      proxyExcludedHostsDescription:
        'ホスト名と IP アドレスのカンマ区切りリスト。これらのホストへの接続はプロキシを経由しません。',
      // proxy custom
      proxyUrl: 'プロキシ URL',
      proxyUrlDescription:
        '<code>http://</code>、<code>https://</code>、<code>socks5://</code>、または <code>pac+https://</code> の URL を指定してください。',
      proxyUsername: 'ユーザー名',
      proxyPassword: 'パスワード',
      proxyAuthWarning:
        '地理的視覚化用の地図データなど、一部のリソースは、認証が必要なプロキシを経由して現在読み込むことができません。',
      // oidc
      oidcIntro:
        'Compass のサーバー接続および Atlas Login 用の OIDC 認証メカニズムの動作を変更します。',
      oidcServerOptionsTitle: 'MongoDB サーバー OIDC 認証オプション',
      // gen-ai
      genAiIntro: '高度な生成 AI 機能へのアクセスを提供します。',
      // feature preview
      featurePreviewIntro:
        'これらの設定は Compass の実験的な動作を制御します。自己責任でご使用ください！',
      // state labels
      stateSetCli:
        'この設定は Compass の起動時に設定されているため、変更できません。',
      stateSetGlobal:
        'この設定はグローバル Compass 構成ファイルで設定されているため、変更できません。',
      stateHardcoded:
        'この設定は、この Compass エディションでは無効になっているため、変更できません。',
      stateDerived:
        'この設定は、他のオプションによって値が暗黙的に決まるため、変更できません。',
    },
  },
});
