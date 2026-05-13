import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassGlobalWrites',
  resources: {
    en: {
      tabName: 'Global Writes',
      warningIconLabel: 'warning',
      importantIconLabel: 'important',
      shardKeyTooltip:
        "Collections in Atlas Global Clusters with Atlas-managed sharding must be configured with a compound shard key made up of both a 'location' field and an identifier field that you provide. Please configure sharding here.",
    },
    ja: {
      tabName: 'グローバル書き込み',
      warningIconLabel: '警告',
      importantIconLabel: '重要',
      shardKeyTooltip:
        'Atlas管理シャーディングを使用するAtlasグローバルクラスター内のコレクションは、「location」フィールドと指定する識別子フィールドの両方で構成された複合シャードキーで設定する必要があります。ここでシャーディングを設定してください。',
    },
  },
});
