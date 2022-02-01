// Privacy Settings Modal
export const PrivacySettingsModal = '[data-test-id="privacy-settings-modal"]';
export const ClosePrivacySettingsButton =
  '[data-test-id="close-privacy-settings-button"]';

// Feature Tour Modal
export const FeatureTourModal = '[data-test-id="feature-tour-modal"]';
export const CloseFeatureTourModal = '[data-test-id="close-tour-button"]';

// Connection screen
export const ConnectSection = '[data-test-id="connect-section"]';
export const ConnectButton = '[data-test-id="connect-button"]';
export const ConnectionStringInput = 'input[name="connectionString"]';
export const CancelConnectionButton =
  '[data-test-id="cancel-connection-button"]';
export const ConnectionStatusModalContent =
  '[data-test-id="connecting-modal-content"]';
export const ShowConnectionFormButton =
  '[data-test-id="show-connection-form-button"]';
export const ConnectionForm = '[data-test-id="connection-form"]';
export const ConnectionFormHostnameTabButton =
  '[data-test-id="connection-form"] #Hostname';
export const ConnectionFormMoreOptionsTabButton =
  '[data-test-id="connection-form"] #More_Options';
export const ConnectionFormInputHostname =
  '[data-test-id="connection-form"] [name="hostname"]';
export const ConnectionFormInputPort =
  '[data-test-id="connection-form"] [name="port"]';
export const ConnectionFormInputSrvRecord =
  '[data-test-id="connection-form"] [name="srvRecord"]';
export const ConnectionFormInputAuthStrategy =
  '[data-test-id="connection-form"] [name="authStrategy"]';
export const ConnectionFormInputKerberosPrincipal =
  '[data-test-id="connection-form"] [name="kerberos-principal"]';
export const ConnectionFormInputLDAPUsername =
  '[data-test-id="connection-form"] [name="ldap-username"]';
export const ConnectionFormInputUsername =
  '[data-test-id="connection-form"] [name="username"]';
export const ConnectionFormInputLDAPPassword =
  '[data-test-id="connection-form"] [name="ldap-password"]';
export const ConnectionFormInputPassword =
  '[data-test-id="connection-form"] [name="password"]';
export const ConnectionFormInputKerberosServiceName =
  '[data-test-id="connection-form"] [name="kerberos-service-name"]';
export const ConnectionFormInputReplicaSet =
  '[data-test-id="connection-form"] [name="replicaSet"]';
export const ConnectionFormInputSSLMethod =
  '[data-test-id="connection-form"] [name="sslMethod"]';
export const ConnectionFormInputSSHTunnel =
  '[data-test-id="connection-form"] [name="sshTunnel"]';
export const ConnectionFormInputSSHTunnelHostname =
  '[data-test-id="connection-form"] [name="sshTunnelHostname"]';
export const ConnectionFormInputSSHTunnelPort =
  '[data-test-id="connection-form"] [name="sshTunnelPort"]';
export const ConnectionFormInputSSHTunnelUsername =
  '[data-test-id="connection-form"] [name="sshTunnelUsername"]';
export const ConnectionFormInputSSHTunnelPassword =
  '[data-test-id="connection-form"] [name="sshTunnelPassword"]';
export const ConnectionFormMessage = '[data-test-id="connection-message"]';

// Connection Sidebar
export const SidebarTreeItems =
  '[data-test-id="databases-and-collections"] [role="treeitem"]';
export const SidebarFilterInput = '[data-test-id="sidebar-filter-input"]';
export const SidebarNewConnectionButton =
  '[data-test-id="new-connection-button"]';
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
export const CreateDatabaseModal = '[trackingid="create_database_modal"]';
export const CreateDatabaseDatabaseName = '[data-testid="database-name"]';
export const CreateDatabaseCollectionName = '[data-testid="collection-name"]';
export const CreateDatabaseCreateButton =
  '[trackingid="create_database_modal"] [role=dialog] > div:nth-child(2) button:first-child';

// Drop database modal
export const DropDatabaseModal = '[trackingid="drop_database_modal"]';
export const DropDatabaseConfirmName =
  '[data-test-id="confirm-drop-database-name"]';
export const DropDatabaseDropButton =
  '[trackingid="drop_database_modal"] [role=dialog] > div:nth-child(2) button:first-child';

// Create collection modal
export const CreateCollectionModal = '[trackingid="create_collection_modal"]';
export const CreateCollectionCollectionName = '[data-testid="collection-name"]';
export const CreateCollectionCreateButton =
  '[trackingid="create_collection_modal"] [role=dialog] > div:nth-child(2) button:first-child';

// Drop collection modal
export const DropCollectionModal = '[trackingid="drop_collection_modal"]';
export const DropCollectionConfirmName =
  '[data-test-id="confirm-drop-collection-name"]';
export const DropCollectionDropButton =
  '[trackingid="drop_collection_modal"] [role=dialog] > div:nth-child(2) button:first-child';

// Shell
export const ShellContent = '[data-test-id="shell-content"]';
export const ShellExpandButton = '[data-test-id="shell-expand-button"]';
export const ShellInput = '[data-test-id="shell-content"] .ace_content';
export const ShellOutput =
  '[data-test-id="shell-content"] [class^=mongosh-shell-output-line] pre';
export const ShellLoader =
  '[data-test-id="shell-content"] [class~=mongosh-shell-loader-shell-loader]';

// Query bar (Find, Schema, Explain Plan)
export const QueryBarApplyFilterButton =
  '[data-test-id="query-bar-apply-filter-button"]';

// Instance screen
export const InstanceTabs = '[data-test-id="instance-tabs"]';
export const InstanceTab = '.test-tab-nav-bar-tab';
export const DatabasesTable = '[data-testid="database-grid"]';
export const InstanceCreateDatabaseButton =
  '[data-testid="database-grid"] [data-testid="create-controls"] button';
// assume that there's only one hovered card at a time and that the first and only button is the drop button
export const DatabaseCardDrop =
  '[data-testid="database-grid"] [data-testid="card-action-container"] button';

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
  return `[data-testid="database-grid-item"][data-id="${dbName}"]`;
};

// Database screen
export const DatabaseTabs = '[data-test-id="database-tabs"]';
export const DatabaseTab = '.test-tab-nav-bar-tab';
export const CollectionsGrid = '[data-testid="collection-grid"]';

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

// Collection screen
export const CollectionTab = '.test-tab-nav-bar-tab';
export const CollectionHeaderTitle = '[data-test-id="collection-header-title"]';
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
  const tn = tabName.toLowerCase().replace(/ /g, ' ');
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
export const InsertDialog = '.insert-document-dialog';
export const InsertDocumentOption =
  '[data-test-id="insert-data-dropdown-insert-document"]';
export const ImportFileOption =
  '[data-test-id="insert-data-dropdown-import-file"]';
export const InsertJSONEditor = '.insert-document-dialog #ace-editor';
export const InsertConfirm =
  '.insert-document-dialog [role=dialog] > div:nth-child(2) button:first-child';
export const ImportModal = '[data-test-id="import-modal"]';
export const ImportFileInput = '#import-file_file_input';
export const FileTypeJSON = '[data-test-id="select-file-type-json"]';
export const ImportConfirm =
  '[data-test-id="import-modal"] [data-test-id="import-button"]';
export const ImportDone =
  '[data-test-id="import-modal"] [data-test-id="done-button"]';

// Aggregations tab
export const StageContainer = '[data-test-id="stage-container"]';

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

// Schema tab
export const AnalyzeSchemaButton = '[data-test-id="analyze-schema-button"]';
export const SchemaFieldList = '.schema-field-list';
export const AnalysisMessage = '.analysis-message';
export const SchemaField = '.schema-field';
export const SchemaFieldName = '.schema-field-name';
export const SchemaFieldTypeList = '.schema-field-type-list';

// Explain Plan tab
export const ExecuteExplainButton = '[data-test-id="execute-explain-button"]';
export const ExplainSummary = '[data-test-id="explain-summary"]';
export const ExplainStage = '[data-test-id="explain-stage"]';

// Indexes tab
export const IndexList = '[data-test-id="index-list"]';
export const IndexComponent = '[data-test-id="index-component"]';
export const NameColumnName = '[data-test-id="name-column-name"]';

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
  return `${tabSelector} ${QueryBarApplyFilterButton}`;
};
export const queryBarOptionsToggle = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-test-id="query-bar-options-toggle"]`;
};

// Tabs at the top
export const CloseCollectionTab = '[data-test-id="close-collection-tab"]';

// Export modal
export const ExportModal = '[data-test-id="export-modal"]';
export const ExportModalQueryText =
  '[data-test-id="export-modal"] [data-test-id="query-viewer-wrapper"] .ace_text-layer';
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
