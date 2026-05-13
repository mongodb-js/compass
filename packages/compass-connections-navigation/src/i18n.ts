import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassConnectionsNavigation',
  resources: {
    en: {
      // connect action
      connect: 'Connect',
      connectInNewWindow: 'In New Window',
      seeMoreConnectionOptions: 'see more connection options',
    },
    ja: {
      // connect action
      connect: '接続',
      connectInNewWindow: '新しいウィンドウで',
      seeMoreConnectionOptions: '接続オプションをさらに表示',
    },
  },
});
