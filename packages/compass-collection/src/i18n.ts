import { createPluginI18n } from '@mongodb-js/compass-i18n';

export const { i18n, I18nProvider, initLanguage } = createPluginI18n({
  namespace: 'compassCollection',
  resources: {
    en: {
      // collection-tab - aria labels
      collectionTabsAriaLabel: 'Collection Tabs',
      // collection-tab - application menu
      menuCollection: '&Collection',
      menuShareSchema: '&Share Schema as JSON (Legacy)',
      menuImportData: '&Import Data',
      menuExportCollection: '&Export Collection',
      // plugin-tab-title - tooltip labels
      tooltipConnection: 'Connection',
      tooltipDatabase: 'Database',
      tooltipView: 'View',
      tooltipDerivedFrom: 'Derived from',
      tooltipCollection: 'Collection',
      // badges
      badgeReadOnly: 'READ-ONLY',
      badgeTimeSeriesIconTitle: 'Time-Series Collection',
      badgeTimeSeriesLabel: 'TIME-SERIES',
      badgeViewIconTitle: 'View',
      badgeViewLabel: 'VIEW',
      badgeQueryableEncryptionIconTitle: 'Queryable Encryption',
      badgeQueryableEncryptionLabel: 'Queryable Encryption',
      badgeClustered: 'CLUSTERED',
      // collection-header-actions
      openShellButton: 'Open MongoDB shell',
      viewMonitoringButton: 'View monitoring',
      visualizeDataButton: 'Visualize Your Data',
      editPipelineButton: 'Edit Pipeline',
      returnToViewButton: 'Return to View',
      // mock-data-generator-modal
      modalTitle: 'Generate Mock Data Script',
      backButton: 'Back',
      cancelButton: 'Cancel',
      stepConfirmButton: 'Confirm',
      stepGenerateScriptButton: 'Generate Script',
      stepDoneButton: 'Done',
      // raw-schema-confirmation-screen
      generatingMappingsText: 'Generating mock data mappings...',
      schemaDescriptionText:
        "We'll use the identified schema to generate a mock data script for your collection. You can customize the script and its <fakerLink>Faker functions</fakerLink> before running it and/or reuse it for your other clusters and collections.",
      enableSampleValuesTitle: 'Enable Sending Sample Field Values',
      enableSampleValuesBody:
        'To improve mock data quality, Project Owners can enable sending sample field values to the AI model. Refresh Data Explorer for changes to take effect.',
      projectSettingsButton: 'Project Settings',
      llmRequestFailed: 'LLM Request failed. Please confirm again.',
      analyzingCollection: 'We are analyzing your collection.',
      // preview-and-doc-count-screen
      specifyDocCountTitle: 'Specify Number of Documents to Generate',
      specifyDocCountDescription:
        'Indicate the amount of documents you want to generate below.',
      docCountLabel: 'Documents to generate in current collection',
      estimatedDiskSizeLabel: 'Estimated Disk Size',
      estimatedDiskSizeNotAvailable: 'Not available',
      previewMockDataTitle: 'Preview Mock Data',
      previewDescription:
        "Below are examples of documents that will be generated when you run your script. If you'd like to make any changes to the script (for ex. what <fakerLink>faker functions</fakerLink> are being used to generate the documents) you can do so in the next step.",
      noFakerSchemaWarning:
        'No faker schema available. Please go back and confirm your schema.',
      // script-screen
      scriptIntroText:
        "We've created the following script for your use. The script can be edited to generate mock data for any collection you specify.",
      scriptGenerationFailedTitle: 'Script Generation Failed:',
      scriptGenerationFailedNote:
        'Please go back to the start screen to re-submit the collection schema.',
      prerequisitesTitle: 'Prerequisites',
      prerequisitesIntro: 'To run the generated script, you must:',
      installMongosh:
        'Install <mongoshLink>mongosh</mongoshLink> (2.5 or later)',
      installFakerjs: 'Install <fakerjsLink>faker.js</fakerjsLink>',
      createJsFileTitle: '1. Create a .js file with the following script',
      createJsFileDescription:
        "In the directory that you created, create a file named <strong>mockdatascript.js</strong> (or any name you'd like). Change the DB_NAME and COLL_NAME in the below script to any database or collection you'd like to add mock data to.",
      runScriptTitle: '2. Run the script with <mongosh>mongosh</mongosh>',
      runScriptDescription:
        'In the same working directory run the command below. Please <strong>paste in your username and password</strong> where there are placeholders. <em>Note that this will add data to your cluster and will not be reversible.</em>',
      resourcesTitle: 'Resources',
      resourceSyntheticData: 'Generating Synthetic Data with MongoDB',
      resourceMongoShell: 'Learn About the MongoDB Shell',
      resourceDatabaseUsers: 'Access your Database Users',
      scriptGenerationFailed: '// Script generation failed.',
    },
    ja: {
      // collection-tab - aria labels
      collectionTabsAriaLabel: 'コレクションタブ',
      // collection-tab - application menu
      menuCollection: '&コレクション',
      menuShareSchema: '&スキーマをJSONとして共有（レガシー）',
      menuImportData: '&データのインポート',
      menuExportCollection: '&コレクションのエクスポート',
      // plugin-tab-title - tooltip labels
      tooltipConnection: '接続',
      tooltipDatabase: 'データベース',
      tooltipView: 'ビュー',
      tooltipDerivedFrom: '派生元',
      tooltipCollection: 'コレクション',
      // badges
      badgeReadOnly: '読み取り専用',
      badgeTimeSeriesIconTitle: '時系列コレクション',
      badgeTimeSeriesLabel: '時系列',
      badgeViewIconTitle: 'ビュー',
      badgeViewLabel: 'ビュー',
      badgeQueryableEncryptionIconTitle: 'クエリ可能な暗号化',
      badgeQueryableEncryptionLabel: 'クエリ可能な暗号化',
      badgeClustered: 'クラスター化',
      // collection-header-actions
      openShellButton: 'MongoDBシェルを開く',
      viewMonitoringButton: 'モニタリングを表示',
      visualizeDataButton: 'データを可視化',
      editPipelineButton: 'パイプラインを編集',
      returnToViewButton: 'ビューに戻る',
      // mock-data-generator-modal
      modalTitle: 'モックデータスクリプトを生成',
      backButton: '戻る',
      cancelButton: 'キャンセル',
      stepConfirmButton: '確認',
      stepGenerateScriptButton: 'スクリプトを生成',
      stepDoneButton: '完了',
      // raw-schema-confirmation-screen
      generatingMappingsText: 'モックデータのマッピングを生成中...',
      schemaDescriptionText:
        '識別されたスキーマを使用して、コレクションのモックデータスクリプトを生成します。スクリプトとその<fakerLink>Faker関数</fakerLink>を実行前にカスタマイズしたり、他のクラスターやコレクションに再利用したりすることができます。',
      enableSampleValuesTitle: 'サンプルフィールド値の送信を有効にする',
      enableSampleValuesBody:
        'モックデータの品質を向上させるために、プロジェクトオーナーはサンプルフィールド値をAIモデルに送信することを有効にできます。変更を有効にするにはData Explorerを更新してください。',
      projectSettingsButton: 'プロジェクト設定',
      llmRequestFailed: 'LLMリクエストが失敗しました。再度確認してください。',
      analyzingCollection: 'コレクションを分析中です。',
      // preview-and-doc-count-screen
      specifyDocCountTitle: '生成するドキュメント数を指定',
      specifyDocCountDescription:
        '以下に生成するドキュメントの数を入力してください。',
      docCountLabel: '現在のコレクションに生成するドキュメント数',
      estimatedDiskSizeLabel: '推定ディスクサイズ',
      estimatedDiskSizeNotAvailable: '利用不可',
      previewMockDataTitle: 'モックデータのプレビュー',
      previewDescription:
        'スクリプトを実行したときに生成されるドキュメントの例を以下に示します。スクリプト（例：ドキュメントの生成に使用される<fakerLink>faker関数</fakerLink>）を変更したい場合は、次のステップで変更できます。',
      noFakerSchemaWarning:
        'Fakerスキーマが利用できません。戻ってスキーマを確認してください。',
      // script-screen
      scriptIntroText:
        'このスクリプトを作成しました。スクリプトは任意のコレクションのモックデータを生成するように編集できます。',
      scriptGenerationFailedTitle: 'スクリプト生成に失敗しました:',
      scriptGenerationFailedNote:
        'スタート画面に戻ってコレクションのスキーマを再送信してください。',
      prerequisitesTitle: '前提条件',
      prerequisitesIntro: '生成されたスクリプトを実行するには、以下が必要です:',
      installMongosh:
        '<mongoshLink>mongosh</mongoshLink>（2.5以降）をインストール',
      installFakerjs: '<fakerjsLink>faker.js</fakerjsLink>をインストール',
      createJsFileTitle: '1. 以下のスクリプトで.jsファイルを作成',
      createJsFileDescription:
        '作成したディレクトリに<strong>mockdatascript.js</strong>（または任意の名前）というファイルを作成します。以下のスクリプトのDB_NAMEとCOLL_NAMEを、モックデータを追加したいデータベースまたはコレクションに変更します。',
      runScriptTitle: '2. <mongosh>mongosh</mongosh>でスクリプトを実行',
      runScriptDescription:
        '同じ作業ディレクトリで以下のコマンドを実行します。プレースホルダーがある箇所に<strong>ユーザー名とパスワードを貼り付けて</strong>ください。<em>これによりクラスターにデータが追加され、元に戻すことはできません。</em>',
      resourcesTitle: 'リソース',
      resourceSyntheticData: 'MongoDBによる合成データの生成',
      resourceMongoShell: 'MongoDBシェルについて学ぶ',
      resourceDatabaseUsers: 'データベースユーザーにアクセス',
      scriptGenerationFailed: '// スクリプト生成に失敗しました。',
    },
  },
});
