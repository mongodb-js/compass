import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassConnections',
  resources: {
    en: {
      // connection progress toasts
      connectingToTitle: 'Connecting to {connectionTitle}',
      completeAuthInBrowser: 'Go to the browser to complete authentication',
      connectedToTitle: 'Connected to {connectionTitle}',
      cancel: 'CANCEL',
      // connection failed toast
      connectionFailed: 'Connection failed',
      review: 'Review',
      debug: 'Debug',
      // maximum connections toast
      maxConnectionsTitle: 'Maximum concurrent connections limit reached',
      maxConnectionsMessage:
        'Only {count, plural, one {# connection} other {# connections}} can be connected to at the same time. First disconnect from another connection.',
      // device auth modal
      deviceAuthTitle: 'Complete authentication in the browser',
      deviceAuthVisitUrl:
        'Visit the following URL to complete authentication for {connectionTitle}:',
      deviceAuthEnterCode: 'Enter the following code on that page:',
    },
    ja: {
      // connection progress toasts
      connectingToTitle: '{connectionTitle} に接続しています',
      completeAuthInBrowser: 'ブラウザで認証を完了してください',
      connectedToTitle: '{connectionTitle} に接続しました',
      cancel: 'キャンセル',
      // connection failed toast
      connectionFailed: '接続に失敗しました',
      review: '確認',
      debug: 'デバッグ',
      // maximum connections toast
      maxConnectionsTitle: '同時接続数の上限に達しました',
      maxConnectionsMessage:
        '同時に接続できるのは {count, plural, other {#}} 件までです。別の接続を切断してからお試しください。',
      // device auth modal
      deviceAuthTitle: 'ブラウザで認証を完了してください',
      deviceAuthVisitUrl:
        '{connectionTitle} の認証を完了するには、次の URL にアクセスしてください:',
      deviceAuthEnterCode: 'そのページで次のコードを入力してください:',
    },
  },
});
