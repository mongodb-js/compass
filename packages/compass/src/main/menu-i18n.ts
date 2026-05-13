import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, initLanguage } = createPluginI18n({
  namespace: 'compassMenu',
  resources: {
    en: {
      // Quit / Exit
      quit: 'Quit',
      exit: 'E&xit',
      quitDialogTitle: 'Quit {appName}',
      quitDialogMessage: 'Are you sure you want to quit?',
      quitConfirm: 'Quit',
      cancel: 'Cancel',
      ok: 'OK',
      doNotAskAgain: 'Do not ask me again',
      // Settings
      settings: '&Settings',
      // Auto-update states
      checkForUpdates: 'Check for updates…',
      installingUpdates: 'Installing updates…',
      restartToUpdate: 'Restart to Update',
      // Darwin app submenu
      aboutApp: 'About {appName}',
      hide: 'Hide',
      hideOthers: 'Hide Others',
      showAll: 'Show All',
      // Connections menu
      connections: '&Connections',
      importConnections: '&Import Saved Connections',
      exportConnections: '&Export Saved Connections',
      // Edit menu
      edit: 'Edit',
      undo: 'Undo',
      redo: 'Redo',
      cut: 'Cut',
      copy: 'Copy',
      paste: 'Paste',
      selectAll: 'Select All',
      find: 'Find',
      // Non-darwin About dialog
      nonDarwinAboutItem: '&About {appName}',
      nonDarwinAboutDialogTitle: 'About {appName}',
      nonDarwinAboutVersion: 'Version {version}',
      // Help menu
      help: '&Help',
      onlineHelp: '&Online {appName} Help',
      license: '&License',
      viewSourceCode: '&View Source Code on GitHub',
      suggestFeature: '&Suggest a Feature',
      reportBug: '&Report a Bug',
      openLogFile: '&Open Log File',
      // View menu
      view: '&View',
      reload: '&Reload',
      reloadData: '&Reload Data',
      actualSize: 'Actual Size',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      toggleDevTools: '&Toggle DevTools',
      // Window menu
      window: 'Window',
      newWindow: 'New &Window',
      newWindowDock: 'New Window',
      minimize: 'Minimize',
      close: 'Close',
      bringAllToFront: 'Bring All to Front',
    },
    ja: {
      // Quit / Exit
      quit: '終了',
      exit: '終了(&X)',
      quitDialogTitle: '{appName} を終了',
      quitDialogMessage: '本当に終了しますか？',
      quitConfirm: '終了',
      cancel: 'キャンセル',
      ok: 'OK',
      doNotAskAgain: '次回から確認しない',
      // Settings
      settings: '設定(&S)',
      // Auto-update states
      checkForUpdates: 'アップデートを確認…',
      installingUpdates: 'アップデートをインストール中…',
      restartToUpdate: '再起動してアップデート',
      // Darwin app submenu
      aboutApp: '{appName} について',
      hide: '隠す',
      hideOthers: '他を隠す',
      showAll: 'すべてを表示',
      // Connections menu
      connections: '接続(&C)',
      importConnections: '保存した接続をインポート(&I)',
      exportConnections: '保存した接続をエクスポート(&E)',
      // Edit menu
      edit: '編集',
      undo: '元に戻す',
      redo: 'やり直す',
      cut: '切り取り',
      copy: 'コピー',
      paste: '貼り付け',
      selectAll: 'すべてを選択',
      find: '検索',
      // Non-darwin About dialog
      nonDarwinAboutItem: '{appName} について(&A)',
      nonDarwinAboutDialogTitle: '{appName} について',
      nonDarwinAboutVersion: 'バージョン {version}',
      // Help menu
      help: 'ヘルプ(&H)',
      onlineHelp: '{appName} オンラインヘルプ(&O)',
      license: 'ライセンス(&L)',
      viewSourceCode: 'GitHub でソースコードを表示(&V)',
      suggestFeature: '機能を提案(&S)',
      reportBug: 'バグを報告(&R)',
      openLogFile: 'ログファイルを開く(&O)',
      // View menu
      view: '表示(&V)',
      reload: '再読み込み(&R)',
      reloadData: 'データを再読み込み(&D)',
      actualSize: '実際のサイズ',
      zoomIn: '拡大',
      zoomOut: '縮小',
      toggleDevTools: 'DevToolsを切り替える(&T)',
      // Window menu
      window: 'ウィンドウ',
      newWindow: '新しいウィンドウ(&W)',
      newWindowDock: '新しいウィンドウ',
      minimize: '最小化',
      close: '閉じる',
      bringAllToFront: 'すべてのウィンドウを最前面に表示',
    },
  },
});
