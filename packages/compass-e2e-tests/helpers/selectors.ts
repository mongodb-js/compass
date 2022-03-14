// Privacy Settings Modal
export const PrivacySettingsModal = '[data-test-id="privacy-settings-modal"]';
export const ClosePrivacySettingsButton =
  '[data-test-id="close-privacy-settings-button"]';

// Feature Tour Modal
export const FeatureTourModal = '[data-test-id="feature-tour-modal"]';
export const CloseFeatureTourModal = '[data-test-id="close-tour-button"]';

// Connection screen
export const ConnectSection = '[data-testid="connections-disconnected"]';
export const ConnectButton = '[data-testid="connect-button"]';
export const ConnectionStringInput = 'textarea[data-testid="connectionString"]';
export const CancelConnectionButton =
  '[data-testid="cancel-connection-button"]';
export const ConnectionStatusModalContent =
  '[data-testid="connecting-modal-content"]';
export const ShowConnectionFormButton =
  '[data-testid="advanced-connection-options"]';
export const ConnectionForm = '[data-testid="connection-form"]';
export const ConnectionFormGeneralTabButton =
  '[data-testid="connection-general-tab"]';
export const ConnectionFormAuthenticationTabButton =
  '[data-testid="connection-authentication-tab"]';
export const ConnectionFormTLSTabButton = '[data-testid="connection-tls-tab"]';
export const ConnectionFormTLSONButton =
  'label[for="connection-tls-enabled-ON-radio-button"]';
export const ConnectionFormTLSOFFButton =
  'label[for="connection-tls-enabled-OFF-radio-button"]';
export const ConnectionFormInputHost =
  '[data-testid="connection-host-input-0"]';
export const ConnectionFormInputSrvRecord =
  'label[for="connection-scheme-srv-radiobox"]';
export const ConnectionFormDefaultAuthMethodButton =
  'label[for="connection-authentication-method-DEFAULT-button"]';
export const ConnectionFormInputUsername =
  '[data-testid="connection-username-input"]';
export const ConnectionFormInputPassword =
  '[data-testid="connection-password-input"]';
export const ConnectionFormErrorMessage =
  '[data-testid="connection-error-summary"]';

export const AdvancedOptionsTabs = '[aria-label="Advanced Options Tabs"]';
export const SelectedAdvancedOptionsTab = `${AdvancedOptionsTabs} [aria-selected="true"]`;

export const ConnectionFormSchemeRadios =
  '#connection-scheme-radio-box-group input[type="radio"]';
export const ConnectionFormHostInputs =
  '[aria-labelledby="connection-host-input-label"]';
export const ConnectionFormDirectConnectionCheckbox =
  '#direct-connection-checkbox';
export const ConnectionFormAuthenticationMethodRadios =
  '#authentication-method-radio-box-group input[type="radio"]';
export const ConnectionFormInputAuthSource = '#authSourceInput';
export const ConnectionFormAuthMechanismRadios =
  '#authentication-mechanism-radio-box-group input[type="radio"]';
export const ConnectionFormInputGssApiPrincipal =
  '[data-testid="gssapi-principal-input"]';
export const ConnectionFormInputGssApiServiceName =
  '[data-testid="gssapi-service-name-input"]';
export const ConnectionFormCanonicalizeHostNameRadios =
  '#canonicalize-hostname-select input[type="radio"]';
export const ConnectionFormInputGssApiServiceRealm =
  '[data-testid="gssapi-service-realm-input"]';
export const ConnectionFormGssApiPasswordCheckbox =
  '[data-testid="gssapi-password-checkbox"]';
export const ConnectionFormInputGssApiPassword =
  '[data-testid="gssapi-password-input"]';
export const ConnectionFormInputPlainUsername =
  '[data-testid="connection-plain-username-input"]';
export const ConnectionFormInputPlainPassword =
  '[data-testid="connection-plain-password-input"]';
export const ConnectionFormInputAWSAccessKeyId =
  '[data-testid="connection-form-aws-access-key-id-input"]';
export const ConnectionFormInputAWSSecretAccessKey =
  '[data-testid="connection-form-aws-secret-access-key-input"]';
export const ConnectionFormInputAWSSessionToken =
  '[data-testid="connection-form-aws-secret-token-input"]';
export const ConnectionFormSSLConnectionRadios =
  '#tls-radio-box-group input[type="radio"]';
export const ConnectionFormTlsCaButton = '#tlsCAFile';
export const ConnectionFormTlsCertificateKeyButton = '#tlsCertificateKeyFile';
export const ConnectionFormTlsCaFile = '[data-testid="tlsCAFile-input"]';
export const ConnectionFormTlsCertificateKeyFile =
  '[data-testid="tlsCertificateKeyFile-input"]';
export const ConnectionFormInputTlsCertificateKeyFilePassword =
  '[data-testid="tlsCertificateKeyFilePassword-input"]';
export const ConnectionFormTlsInsecureCheckbox =
  '[data-testid="tlsInsecure-input"]';
export const ConnectionFormTlsAllowInvalidHostnamesCheckbox =
  '[data-testid="tlsAllowInvalidHostnames-input"]';
export const ConnectionFormTlsAllowInvalidCertificatesCheckbox =
  '[data-testid="tlsAllowInvalidCertificates-input"]';
export const ConnectionFormTlsUseSystemCACheckbox =
  '[data-testid="useSystemCA-input"]';
export const ConnectionFormProxyMethodRadios =
  '#ssh-options-radio-box-group input[type="radio"]';
export const ConnectionFormInputSshPasswordHost =
  '[data-testid="ssh-password-tab-content"] [data-testid="host"]';
export const ConnectionFormInputSshPasswordPort =
  '[data-testid="ssh-password-tab-content"] [data-testid="port"]';
export const ConnectionFormInputSshPasswordUsername =
  '[data-testid="ssh-password-tab-content"] [data-testid="username"]';
export const ConnectionFormInputSshPasswordPassword =
  '[data-testid="ssh-password-tab-content"] [data-testid="password"]';
export const ConnectionFormInputSshIdentityHost =
  '[data-testid="ssh-identity-tab-content"] [data-testid="host"]';
export const ConnectionFormInputSshIdentityPort =
  '[data-testid="ssh-identity-tab-content"] [data-testid="port"]';
export const ConnectionFormInputSshIdentityUsername =
  '[data-testid="ssh-identity-tab-content"] [data-testid="username"]';
export const ConnectionFormSshIdentityKeyButton =
  '[data-testid="ssh-identity-tab-content"]  #identityKeyFile';
export const ConnectionFormSshIdentityKeyFile =
  '[data-testid="ssh-identity-tab-content"] [data-testid="identityKeyFile"]';
export const ConnectionFormInputSshIdentityPassword =
  '[data-testid="ssh-identity-tab-content"] [data-testid="identityKeyPassphrase"]';
export const ConnectionFormInputSocksHost =
  '[data-testid="socks-tab-content"] [data-testid="proxyHost"]';
export const ConnectionFormInputSocksPort =
  '[data-testid="socks-tab-content"] [data-testid="proxyPort"]';
export const ConnectionFormInputSocksUsername =
  '[data-testid="socks-tab-content"] [data-testid="proxyUsername"]';
export const ConnectionFormInputSocksPassword =
  '[data-testid="socks-tab-content"] [data-testid="proxyPassword"]';
export const ConnectionFormReadPreferenceRadios =
  '#read-preferences input[type="radio"]';
export const ConnectionFormInputReplicaset =
  '[data-testid="connection-advanced-tab"] [data-testid="replica-set"]';
export const ConnectionFormInputDefaultDatabase =
  '[data-testid="connection-advanced-tab"] [data-testid="default-database"]';
export const ConnectionFormUrlOptionKeys =
  '[data-testid="connection-advanced-tab"] button[name="name"]';
export const ConnectionFormUrlOptionValues =
  '[data-testid="connection-advanced-tab"] input[aria-labelledby="Enter value"]';

export const advancedOptionsTab = (tabName: string): string => {
  return `${AdvancedOptionsTabs} button[name="${tabName}"]`;
};
export const advancedOptionsTabPanel = (tabName: string): string => {
  return `[role="tabpanel"][aria-label="${tabName}"]`;
};
export const connectionFormSchemeRadio = (value: string): string => {
  return `#connection-scheme-radio-box-group input[value="${value}"]`;
};
export const connectionFormAuthenticationMethodRadio = (
  value: string
): string => {
  return `#authentication-method-radio-box-group input[value="${value}"]`;
};
export const connectionFormAuthMechanismRadio = (value: string): string => {
  return `#authentication-mechanism-radio-box-group input[value="${value}"]`;
};
export const connectionFormCanonicalizeHostNameRadio = (
  value: string
): string => {
  return `#canonicalize-hostname-select input[value="${value}"]`;
};
export const connectionFormSSLConnectionRadio = (value: string): string => {
  return `#tls-radio-box-group input[value="${value}"]`;
};
export const connectionFormProxyMethodRadio = (value: string): string => {
  return `#ssh-options-radio-box-group input[value="${value}"]`;
};
export const connectionFormReadPreferenceRadio = (value: string): string => {
  return `#read-preferences input[value="${value}"]`;
};
export const connectionFormUrlOptionKeyButton = (index: number): string => {
  return `[data-testid="url-options-table"] tr:nth-child(${
    index + 1
  }) button[name="name"]`;
};
export const connectionFormUrlOptionValueInput = (index: number): string => {
  return `[data-testid="url-options-table"] tr:nth-child(${
    index + 1
  }) input[aria-labelledby="Enter value"]`;
};

// Connection Sidebar
export const SidebarDatabaseAndConnectionList =
  '[data-test-id="databases-and-collections"]';
export const SidebarTreeItems =
  `${SidebarDatabaseAndConnectionList} [role="treeitem"]`;
export const SidebarFilterInput = '[data-test-id="sidebar-filter-input"]';
export const SidebarNewConnectionButton =
  '[data-testid="new-connection-button"]';
export const TopologySingleHostAddress =
  '[data-test-id="topology-single-host-address"]';
export const SingleClusterType =
  '[data-test-id="topology-single-cluster-type"]';
export const ServerVersionText = '[data-test-id="server-version-text"]';
export const SidebarTitle = '[data-test-id="sidebar-title"]';
export const SidebarCreateDatabaseButton =
  '[data-test-id="create-database-button"]';
export const ShowActionsButton = '[data-testid="show-actions"]';
export const DropDatabaseButton = '[data-action="drop-database"]';
export const CreateCollectionButton = '[data-action="create-collection"]';
export const DropCollectionButton = '[data-action="drop-collection"]';

export const sidebarDatabase = (dbName: string): string => {
  return `[data-testid="sidebar-database-${dbName}"]`;
};

export const sidebarDatabaseToggle = (dbName: string): string => {
  return `[data-testid="sidebar-database-${dbName}"] button[type=button]`;
};

export const sidebarCollection = (
  dbName: string,
  collectionName: string
): string => {
  return `[data-testid="sidebar-collection-${dbName}.${collectionName}"]`;
};

// Create database modal
export const CreateDatabaseModal = '[data-testid="create_database_modal"]';
export const CreateDatabaseDatabaseName = '[data-testid="database-name"]';
export const CreateDatabaseCollectionName = '[data-testid="collection-name"]';
export const CreateDatabaseCreateButton =
  '[data-testid="create_database_modal"] [role=dialog] > div:nth-child(2) button:first-child';

// Drop database modal
export const DropDatabaseModal = '[data-testid="drop_database_modal"]';
export const DropDatabaseConfirmName =
  '[data-test-id="confirm-drop-database-name"]';
export const DropDatabaseDropButton =
  '[data-testid="drop_database_modal"] [role=dialog] > div:nth-child(2) button:first-child';

// Create collection modal
export const CreateCollectionModal = '[data-testid="create_collection_modal"]';
export const CreateCollectionCollectionName = '[data-testid="collection-name"]';
export const CreateCollectionCreateButton =
  '[data-testid="create_collection_modal"] [role=dialog] > div:nth-child(2) button:first-child';
export const CreateCollectionCappedCheckboxLabel =
  '[data-testid="capped-collection-fields"] #toggle-capped-collection-fields-label';
export const CreateCollectionCappedSizeInput =
  '[data-testid="capped-collection-fields"] [data-testid="capped-size"]';
export const CreateCollectionCustomCollationCheckboxLabel =
  '[data-testid="use-custom-collation-fields"] #toggle-use-custom-collation-fields-label';

export const CreateCollectionTimeseriesCheckboxLabel =
  '[data-testid="time-series-fields"] #toggle-time-series-fields-label';
export const CreateCollectionTimeseriesTimeField =
  '[data-testid="time-series-fields"] [name="timeSeries.timeField"]';
export const CreateCollectionTimeseriesMetaField =
  '[data-testid="time-series-fields"] [name="timeSeries.metaField"]';
export const CreateCollectionTimeseriesGranularityButton =
  '[data-testid="time-series-fields"] [name="timeSeries.granularity"]';
export const CreateCollectionTimeseriesGranularityMenu =
  '[data-testid="time-series-fields"] #timeSeries-granularity-menu';
export const CreateCollectionTimeseriesExpireAfterSeconds =
  '[data-testid="time-series-fields"] [name="expireAfterSeconds"]';

export const createCollectionCustomCollationFieldButton = (
  fieldName: string
): string => {
  return `[data-testid="use-custom-collation-fields"] [name="${fieldName}"]`;
};

export const createCollectionCustomCollationFieldMenu = (
  fieldName: string
): string => {
  return `[data-testid="use-custom-collation-fields"] #collation-field-${fieldName}-menu`;
};

// Drop collection modal
export const DropCollectionModal = '[data-testid="drop_collection_modal"]';
export const DropCollectionConfirmName =
  '[data-test-id="confirm-drop-collection-name"]';
export const DropCollectionDropButton =
  '[data-testid="drop_collection_modal"] [role=dialog] > div:nth-child(2) button:first-child';

// Shell
export const ShellContent = '[data-test-id="shell-content"]';
export const ShellExpandButton = '[data-test-id="shell-expand-button"]';
export const ShellInput = '[data-test-id="shell-content"] .ace_content';
export const ShellOutput =
  '[data-test-id="shell-content"] [class^=mongosh-shell-output-line] pre';
export const ShellLoader =
  '[data-test-id="shell-content"] [class~=mongosh-shell-loader-shell-loader]';

// Query bar (Find, Schema, Explain Plan)
export const QueryBarMenuActions = '#query-bar-menu-actions';

// Instance screen
export const InstanceTabs = '[data-test-id="instance-tabs"]';
export const InstanceTab = '.test-tab-nav-bar-tab';
export const DatabasesTable = '[data-testid="database-grid"]';
export const InstanceCreateDatabaseButton =
  '[data-testid="database-grid"] [data-testid="create-controls"] button';
export const DatabaseCard = '[data-testid="database-grid-item"]';
// assume that there's only one hovered card at a time and that the first and only button is the drop button
export const DatabaseCardDrop =
  '[data-testid="database-grid"] [data-testid="card-action-container"] button';
export const ServerStats = '.serverstats';

export const instanceTab = (tabName: string, selected?: boolean): string => {
  const selector = `${InstanceTab}[name="${tabName}"]`;

  if (selected === true) {
    return `${selector}[aria-selected="true"]`;
  }

  if (selected === false) {
    return `${selector}[aria-selected="false"]`;
  }

  return selector;
};
export const databaseCard = (dbName: string): string => {
  return `${DatabaseCard}[data-id="${dbName}"]`;
};

export const databaseCardClickable = (dbName: string): string => {
  // webdriver does not like clicking on the card even though the card has the
  // click handler, so click on the title
  return `${databaseCard(dbName)} [title="${dbName}"]`;
};

// Database screen
export const DatabaseTabs = '[data-test-id="database-tabs"]';
export const DatabaseTab = '.test-tab-nav-bar-tab';
export const CollectionsGrid = '[data-testid="collection-grid"]';
export const DatabaseCreateCollectionButton =
  '[data-testid="collection-grid"] [data-testid="create-controls"] button';
export const CollectionCard = '[data-testid="collection-grid-item"]';
// assume that there's only one hovered card at a time and that the first and only button is the drop button
export const CollectionCardDrop =
  '[data-testid="collection-grid"] [data-testid="card-action-container"] button';

export const databaseTab = (tabName: string, selected?: boolean): string => {
  const selector = `${DatabaseTab}[name="${tabName}"]`;

  if (selected === true) {
    return `${selector}[aria-selected="true"]`;
  }

  if (selected === false) {
    return `${selector}[aria-selected="false"]`;
  }

  return selector;
};

export const collectionCard = (
  dbName: string,
  collectionName: string
): string => {
  return `${CollectionCard}[data-id="${dbName}.${collectionName}"]`;
};

export const collectionCardClickable = (
  dbName: string,
  collectionName: string
): string => {
  // webdriver does not like clicking on the card even though the card has the
  // click handler, so click on the title
  return `${collectionCard(
    dbName,
    collectionName
  )} [title="${collectionName}"]`;
};

// Collection screen
export const CollectionTab = '.test-tab-nav-bar-tab';
export const CollectionHeaderTitle = '[data-testid="collection-header-title"]';
export const CollectionHeaderNamespace =
  '[data-testid="collection-header-namespace"]';
export const DocumentCountValue = '[data-test-id="document-count-value"]';
export const StorageSizeValue = '[data-test-id="storage-size-value"]';
export const AvgDocumentSizeValue = '[data-test-id="avg-document-size-value"]';
export const IndexCountValue = '[data-test-id="index-count-value"]';
export const TotalIndexSizeValue = '[data-test-id="total-index-size-value"]';
export const AvgIndexSizeValue = '[data-test-id="avg-index-size-value"]';

export const collectionTab = (tabName: string, selected?: boolean): string => {
  const selector = `${CollectionTab}[name="${tabName}"]`;

  if (selected === true) {
    return `${selector}[aria-selected="true"]`;
  }

  if (selected === false) {
    return `${selector}[aria-selected="false"]`;
  }

  return selector;
};
export const collectionContent = (tabName: string): string => {
  const tn = tabName.toLowerCase().replace(/ /g, '-');
  return `[data-test-id="${tn}-content"]`;
};
export const collectionHeaderTitle = (
  dbName: string,
  collectionName: string
): string => {
  return `${CollectionHeaderTitle}[title="${dbName}.${collectionName}"]`;
};

// Documents tab
export const DocumentListActionBarMessage = '.document-list-action-bar-message';
export const ExportCollectionButton =
  '[data-test-id="export-collection-button"]';
export const DocumentListFetching =
  '[data-test-id="documents-content"] [data-testid="fetching-documents"]';
export const DocumentListFetchingStopButton =
  '[data-test-id="documents-content"] [data-testid="fetching-documents"] button';
export const DocumentListError =
  '[data-test-id="documents-content"] .status-row-has-error';
export const AddDataButton = '#insert-data-dropdown';
export const InsertDocumentOption =
  '[data-test-id="insert-data-dropdown-insert-document"]';
export const ImportFileOption =
  '[data-test-id="insert-data-dropdown-import-file"]';

// Insert Document modal

export const InsertDialog = '.insert-document-dialog';
export const InsertDialogErrorMessage =
  '[data-testid="insert_document_modal"] .document-footer.document-footer-is-error .document-footer-message';
export const InsertJSONEditor = '.insert-document-dialog #ace-editor';
export const InsertConfirm =
  '.insert-document-dialog [role=dialog] > div:nth-child(2) button:first-child';
export const InsertCancel =
  '.insert-document-dialog [role=dialog] > div:nth-child(2) button:last-child';

// Import File modal

export const ImportModal = '[data-test-id="import-modal"]';
export const ImportDelimiter = '[id="import-delimiter-select"]';
export const ImportFileInput = '#import-file_file_input';
export const FileTypeJSON = '[data-test-id="select-file-type-json"]';
export const FileTypeCSV = '[data-test-id="select-file-type-csv"]';
export const ImportConfirm =
  '[data-test-id="import-modal"] [data-test-id="import-button"]';
export const ImportCancel =
  '[data-test-id="import-modal"] [data-test-id="cancel-button"]';
export const ImportDone =
  '[data-test-id="import-modal"] [data-test-id="done-button"]';
export const ImportErrorBox = '[data-test-id="import-error-box"]';

export const importPreviewFieldHeaderSelect = (fieldName: string): string => {
  return `[data-test-id="preview-field-header-${fieldName}"] select`;
};

export const importPreviewFieldHeaderCheckbox = (fieldName: string): string => {
  return `[data-test-id="preview-field-header-${fieldName}"] input[type="checkbox"]`;
};

// Document list view

export const DocumentListFirstItemFields =
  '[data-test-id="document-list-item"]:first-child .editable-element-field';
export const DocumentListFirstItemValues =
  '[data-test-id="document-list-item"]:first-child .element-value, [data-test-id="document-list-item"]:first-child .editable-expandable-element-header-label';

// Query bar history

export const QueryBarHistoryButton = '[data-test-id="query-history-button"]';
export const QueryBarHistory = '[data-test-id="query-history"]';

export const QueryHistoryRecentItem = '[data-testid="recent-query-list-item"]';
export const QueryHistoryFavoriteAnItemButton =
  '[data-test-id="query-history-button-fav"]';
export const QueryHistoryFavoriteItemNameField =
  '[data-test-id="query-history-saving-form-input-name"]';
export const QueryHistorySaveFavoriteItemButton =
  '[data-test-id="query-history-saving-form-button-save"]';

export const myQueriesItem = (title: string): string => {
  return `[title="${title}"]`;
};

export const MyQueriesList = '[data-testid="my-queries-list"]';

// Aggregations tab
export const StageContainer = '[data-test-id="stage-container"]';
export const CreateNewPipelineButton = 'button#create-new-pipeline';
export const ToggleAggregationCollation = '[data-test-id="toggle-collation"]';
export const AggregationCollationInput = '[data-test-id="collation-string"]';
export const AggregationSettingsButton =
  '[data-test-id="aggregation-settings"]';
export const AggregationCommentModeCheckbox = '#aggregation-comment-mode';
export const AggregationSampleSizeInput = '#aggregation-sample-size';
export const AggregationMaxTimeMS = '#aggregation-max-time-ms';
export const AggregationSettingsApplyButton = '#aggregation-settings-apply';
export const AddStageButton = '[data-test-id="add-stage"]';
export const ExportAggregationToLanguage =
  '[data-test-id="aggregations-content"] [data-test-id="export-to-language"]';
export const NewPipelineActions = '#new-pipeline-actions';
export const NewPipelineActionsMenu = `${NewPipelineActions} + [role="menu"]`;
export const SavePipelineActions = '#save-pipeline-actions';
export const SavePipelineActionsCreateView = '[data-testid="create-a-view"]';
export const SavePipelineActionsSaveAs = '[data-testid="save-pipeline-as"]';

// Create view from pipeline modal
export const CreateViewModal = '[data-testid="create_view_modal"]';
export const CreateViewNameInput = '#create-view-name';

// Save aggregation from pipeline modal
export const SavePipelineModal = '[data-testid="save_pipeline_modal"]';
export const SavePipelineNameInput = '#save-pipeline-name';

export const stageOperatorOptions = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [role="option"]`;
};
export const stageEditor = (stageIndex: number): string => {
  return `#aggregations-stage-editor-${stageIndex}`;
};
export const stagePreviewToolbarTooltip = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="stage-preview-toolbar-tooltip"]`;
};
export const atlasOnlyStagePreviewSection = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="stage-preview-missing-search-support"]`;
};
export const stagePreviewEmpty = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="stage-preview-empty"]`;
};
export const stageCollapseButton = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] button[title="Collapse"]`;
};
export const stageExpandButton = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] button[title="Expand"]`;
};
export const stageSelectControlInput = (
  stageIndex: number,
  expanded?: boolean
): string => {
  const selector = `[data-stage-index="${stageIndex}"] .Select-control input`; // [role="combobox"]

  if (expanded === true) {
    return `${selector}[aria-expanded="true"]`;
  }

  if (expanded === false) {
    return `${selector}[aria-expanded="false"]`;
  }

  return selector;
};
export const stageTextarea = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] .ace_editor textarea`; // .ace_text-input
};
export const stageContent = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] .ace_content`;
};
export const stageAdd = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="add-after-stage"]`;
};
export const stageToggle = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] #toggle-stage-button`;
};
export const stageDelete = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="delete-stage"]`;
};
export const stageOutSaveButton = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="save-out-documents"]`;
};
export const stageOutCollectionLink = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="go-to-out-collection"]`;
};
export const stageMergeSaveButton = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="save-merge-documents"]`;
};
export const stageMergeCollectionLink = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="go-to-merge-collection"]`;
};
export const stageEditorErrorMessage = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-test-id="stage-editor-error-message"]`;
};

// Schema tab
export const AnalyzeSchemaButton = '[data-test-id="analyze-schema-button"]';
export const SchemaFieldList = '.schema-field-list';
export const AnalysisMessage =
  '[data-test-id="schema-content"] .analysis-message';
export const SchemaField = '.schema-field';
export const SchemaFieldName = '.schema-field-name';
export const SchemaFieldTypeList = '.schema-field-type-list';

// Explain Plan tab
export const ExecuteExplainButton = '[data-test-id="execute-explain-button"]';
export const ExplainSummary = '[data-test-id="explain-summary"]';
export const ExplainStage = '[data-test-id="explain-stage"]';
export const ExplainDocumentsReturnedSummary =
  '[data-test-id="documents-returned-summary"]';

// Indexes tab
export const IndexList = '[data-test-id="index-list"]';
export const IndexComponent = '[data-test-id="index-list"] tr';
export const NameColumnName = '[data-test-id="name-column-name"]';
export const CreateIndexButton =
  '[data-test-id="open-create-index-modal-button"]';
export const CreateIndexModal = '[data-test-id="create-index-modal"]';
export const CreateIndexModalFieldSelect =
  '[data-test-id="create-index-modal-field-select"]';
export const CreateIndexModalTypeSelect =
  '[data-test-id="create-index-modal-type-select"]';
export const CreateIndexConfirmButton = '[data-test-id="create-index-button"]';
export const DropIndexModal = '[data-testid="drop_index_modal"]';
export const DropIndexModalConfirmName =
  '[data-test-id="confirm-drop-index-name"]';
export const DropIndexModalConfirmButton =
  '[data-testid="drop_index_modal"] [role=dialog] > div:nth-child(2) button:first-child';

export const indexComponent = (indexName: string): string => {
  return `[data-test-id="index-component-${indexName}"]`;
};

export const dropIndexButton = (indexName: string): string => {
  return `[data-test-id="index-component-${indexName}"] .btn-default`;
};

// Validation tab
export const AddRuleButton = '[data-test-id="add-rule-button"]';
export const ValidationEditor = '[data-test-id="validation-editor"]';
export const ValidationActionMessage =
  '[data-test-id="validation-action-message"]';
export const UpdateValidationButton =
  '[data-test-id="update-validation-button"]';
export const ValidationMatchingDocumentsPreview =
  '[data-test-id="validation-content"] [data-test-id="matching-documents"] [data-test-id="document-preview"]';
export const ValidationNotMatchingDocumentsPreview =
  '[data-test-id="validation-content"] [data-test-id="notmatching-documents"] [data-test-id="document-preview"]';

// Find (Documents, Schema and Explain Plan tabs)
export const queryBar = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-test-id="query-bar"]`;
};
export const queryBarOptionInputFilter = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} #query-bar-option-input-filter`;
};
export const queryBarOptionInputProject = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} #query-bar-option-input-project`;
};
export const queryBarOptionInputSort = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} #query-bar-option-input-sort`;
};
export const queryBarOptionInputCollation = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} #query-bar-option-input-collation`;
};
export const queryBarOptionInputMaxTimeMS = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [id="querybar-option-input-Max Time MS"]`;
};
export const queryBarOptionInputSkip = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} #querybar-option-input-skip`;
};
export const queryBarOptionInputLimit = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} #querybar-option-input-limit`;
};
export const queryBarApplyFilterButton = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-test-id="query-bar-apply-filter-button"]`;
};
export const queryBarOptionsToggle = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-test-id="query-bar-options-toggle"]`;
};
export const queryBarResetFilterButton = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-test-id="query-bar-reset-filter-button"]`;
};
export const queryBarMenuActionsButton = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} ${QueryBarMenuActions}`;
};
export const queryBarActionsMenu = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} ${QueryBarMenuActions} + [role="menu"]`;
};

// Tabs at the top
export const CloseCollectionTab = '[data-test-id="close-collection-tab"]';

// Export modal
export const ExportModal = '[data-test-id="export-modal"]';
export const ExportModalQueryText =
  '[data-test-id="export-modal"] [data-test-id="query-viewer-wrapper"] .ace_text-layer';
export const ExportModalFullCollectionOption =
  '[data-test-id="export-modal"] [data-test-id="export-full-collection"]';
export const ExportModalSelectFieldsButton =
  '[data-test-id="export-modal"] [data-test-id="select-fields-button"]';
export const ExportModalSelectOutputButton =
  '[data-test-id="export-modal"] [data-test-id="select-output-button"]';
export const ExportModalExportButton =
  '[data-test-id="export-modal"] [data-test-id="export-button"]';
export const ExportModalShowFileButton =
  '[data-test-id="export-modal"] [data-test-id="show-file-button"]';
export const ExportModalCloseButton =
  '[data-test-id="export-modal"] [data-test-id="close-button"]';
export const ExportModalFileText = '[data-test-id="export-modal"] #export-file';

export const selectExportFileTypeButton = (
  fileType: string,
  selected?: boolean
): string => {
  const selector = `[data-test-id="export-modal"] [data-test-id="select-file-type-${fileType}"]`;

  if (selected === true) {
    return `${selector}[aria-selected="true"]`;
  }

  if (selected === false) {
    return `${selector}[aria-selected="false"]`;
  }

  return selector;
};

export const exportModalExportField = (fieldName: string): string => {
  return `[data-test-id="export-modal"] input[type="checkbox"][name="${fieldName}"]`;
};

// Export to language modal
export const ExportToLanguageModal = '[data-test-id="export-to-lang-modal"]';
export const ExportToLanguageLanguageField =
  '[data-test-id="select-lang-field"]';
export const ExportToLanguageLanguageListbox =
  '[data-test-id="select-lang-field"] [role="listbox"]';
export const ExportToLanguageImportsCheckbox =
  '[data-test-id="export-to-lang-checkbox-imports"]';
export const ExportToLanguageDriverCheckbox =
  '[data-test-id="export-to-lang-checkbox-driver"]';
export const ExportToLanguageBuildersCheckbox =
  '[data-test-id="export-to-lang-checkbox-builders"]';
export const ExportToLanguageCopyOutputButton =
  '[data-test-id="export-to-lang-copy-output"]';
export const ExportToLanguageCloseButton =
  '[data-test-id="export-to-lang-modal"] .modal-footer .btn-default';

// Confirm new pipeline modal
export const ConfirmNewPipelineModal =
  '[data-testid="confirm_new_pipeline_modal"]';
export const ConfirmNewPipelineModalConfirmButton =
  '[data-testid="confirm_new_pipeline_modal"] [role=dialog] > div:nth-child(2) button:first-child';

// New pipeline from text modal
export const NewPipelineFromTextModal = '[data-testid="import_pipeline_modal"]';
export const NewPipelineFromTextEditor = '#import-pipeline-editor';
export const NewPipelineFromTextConfirmButton =
  '[data-testid="import_pipeline_modal"] [role=dialog] > div:nth-child(2) button:first-child';

// Confirm import pipeline modal
export const ConfirmImportPipelineModal =
  '[data-testid="confirm_import_pipeline_modal"]';
export const ConfirmImportPipelineModalConfirmButton =
  '[data-testid="confirm_import_pipeline_modal"] [role=dialog] > div:nth-child(2) button:first-child';
