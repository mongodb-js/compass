const Selectors = {
  // Privacy Settings Modal
  PrivacySettingsModal: '[data-test-id="privacy-settings-modal"]',
  ClosePrivacySettingsButton: '[data-test-id="close-privacy-settings-button"]',

  // Feature Tour Modal
  FeatureTourModal: '[data-test-id="feature-tour-modal"]',
  CloseFeatureTourModal: '[data-test-id="close-tour-button"]',

  // Connection screen
  ConnectSection: '[data-test-id="connect-section"]',
  ConnectButton: '[data-test-id="connect-button"]',
  ConnectionStringInput: 'input[name="connectionString"]',
  CancelConnectionButton: '[data-test-id="cancel-connection-button"]',
  ConnectionStatusModalContent: '[data-test-id="connecting-modal-content"]',
  ShowConnectionFormButton: '[data-test-id="show-connection-form-button"]',
  ConnectionForm: '[data-test-id="connection-form"]',
  ConnectionFormHostnameTabButton: '[data-test-id="connection-form"] #Hostname',
  ConnectionFormMoreOptionsTabButton:
    '[data-test-id="connection-form"] #More_Options',
  ConnectionFormInputHostname:
    '[data-test-id="connection-form"] [name="hostname"]',
  ConnectionFormInputPort: '[data-test-id="connection-form"] [name="port"]',
  ConnectionFormInputSrvRecord:
    '[data-test-id="connection-form"] [name="srvRecord"]',
  ConnectionFormInputAuthStrategy:
    '[data-test-id="connection-form"] [name="authStrategy"]',
  ConnectionFormInputKerberosPrincipal:
    '[data-test-id="connection-form"] [name="kerberos-principal"]',
  ConnectionFormInputLDAPUsername:
    '[data-test-id="connection-form"] [name="ldap-username"]',
  ConnectionFormInputUsername:
    '[data-test-id="connection-form"] [name="username"]',
  ConnectionFormInputLDAPPassword:
    '[data-test-id="connection-form"] [name="ldap-password"]',
  ConnectionFormInputPassword:
    '[data-test-id="connection-form"] [name="password"]',
  ConnectionFormInputKerberosServiceName:
    '[data-test-id="connection-form"] [name="kerberos-service-name"]',
  ConnectionFormInputReplicaSet:
    '[data-test-id="connection-form"] [name="replicaSet"]',
  ConnectionFormInputSSLMethod:
    '[data-test-id="connection-form"] [name="sslMethod"]',
  ConnectionFormInputSSHTunnel:
    '[data-test-id="connection-form"] [name="sshTunnel"]',
  ConnectionFormInputSSHTunnelHostname:
    '[data-test-id="connection-form"] [name="sshTunnelHostname"]',
  ConnectionFormInputSSHTunnelPort:
    '[data-test-id="connection-form"] [name="sshTunnelPort"]',
  ConnectionFormInputSSHTunnelUsername:
    '[data-test-id="connection-form"] [name="sshTunnelUsername"]',
  ConnectionFormInputSSHTunnelPassword:
    '[data-test-id="connection-form"] [name="sshTunnelPassword"]',

  // Sidebar
  SidebarCollection: '[data-test-id="sidebar-collection"]',
  SidebarFilterInput: '[data-test-id="sidebar-filter-input"]',
  SidebarNewConnectionButton: '[data-test-id="new-connection-button"]',
  TopologySingleHostAddress: '[data-test-id="topology-single-host-address"]',
  SingleClusterType: '[data-test-id="topology-single-cluster-type"]',
  ServerVersionText: '[data-test-id="server-version-text"]',
  SidebarTitle: '[data-test-id="sidebar-title"]',

  sidebarCollection: (dbName, collectionName) => {
    return `${Selectors.SidebarCollection}[title="${dbName}.${collectionName}"]`;
  },

  // Shell
  ShellContent: '[data-test-id="shell-content"]',
  ShellExpandButton: '[data-test-id="shell-expand-button"]',
  ShellInput: '[data-test-id="shell-content"] .ace_content',
  ShellOutput:
    '[data-test-id="shell-content"] [class^=mongosh-shell-output-line] pre',
  ShellLoader:
    '[data-test-id="shell-content"] [class~=mongosh-shell-loader-shell-loader]',

  // Query bar (Find, Schema, Explain Plan)
  QueryBarApplyFilterButton: '[data-test-id="query-bar-apply-filter-button"]',

  // Instance screen
  InstanceTabs: '[data-test-id="instance-tabs"]',
  InstanceTab: '.test-tab-nav-bar-tab',
  DatabasesTable: '[data-test-id="databases-table"]',

  instanceTab: (tabName, selected) => {
    const selector = `${Selectors.InstanceTab}[name="${tabName}"]`;

    if (selected === true) {
      return `${selector}[aria-selected="true"]`;
    }

    if (selected === false) {
      return `${selector}[aria-selected="false"]`;
    }

    return selector;
  },
  databaseTableLink: (dbName) => {
    return `[data-test-id="databases-table-link-${dbName}"]`;
  },

  // Database screen
  DatabaseTabs: '[data-test-id="database-tabs"]',
  DatabaseTab: '.test-tab-nav-bar-tab',
  CollectionsTableLinkNumbers:
    '[data-test-id="collections-table-link-numbers"]',

  databaseTab: (tabName, selected) => {
    const selector = `${Selectors.DatabaseTab}[name="${tabName}"]`;

    if (selected === true) {
      return `${selector}[aria-selected="true"]`;
    }

    if (selected === false) {
      return `${selector}[aria-selected="false"]`;
    }

    return selector;
  },

  // Collection screen
  CollectionTab: '.test-tab-nav-bar-tab',
  CollectionHeaderTitle: '[data-test-id="collection-header-title"]',
  DocumentCountValue: '[data-test-id="document-count-value"]',
  TotalDocumentSizeValue: '[data-test-id="total-document-size-value"]',
  AvgDocumentSizeValue: '[data-test-id="avg-document-size-value"]',
  IndexCountValue: '[data-test-id="index-count-value"]',
  TotalIndexSizeValue: '[data-test-id="total-index-size-value"]',
  AvgIndexSizeValue: '[data-test-id="avg-index-size-value"]',

  collectionTab: (tabName, selected) => {
    const selector = `${Selectors.CollectionTab}[name="${tabName}"]`;

    if (selected === true) {
      return `${selector}[aria-selected="true"]`;
    }

    if (selected === false) {
      return `${selector}[aria-selected="false"]`;
    }

    return selector;
  },
  collectionContent: (tabName) => {
    const tn = tabName.toLowerCase().replace(/ /g, ' ');
    return `[data-test-id="${tn}-content"]`;
  },
  collectionHeaderTitle: (dbName, collectionName) => {
    return `${Selectors.CollectionHeaderTitle}[title="${dbName}.${collectionName}"]`;
  },

  // Documents tab
  DocumentListActionBarMessage: '.document-list-action-bar-message',
  ExportCollectionButton: '[data-test-id="export-collection-button"]',
  DocumentListFetching:
    '[data-test-id="documents-content"] [data-testid="fetching-documents"]',
  DocumentListFetchingStopButton:
    '[data-test-id="documents-content"] [data-testid="fetching-documents"] button',
  DocumentListError: '[data-test-id="documents-content"] .status-row-has-error',
  AddDataButton: '#insert-data-dropdown',
  InsertDialog: '.insert-document-dialog',
  InsertDocumentOption: '[data-test-id="insert-data-dropdown-insert-document"]',
  ImportFileOption: '[data-test-id="insert-data-dropdown-import-file"]',
  InsertJSONEditor: '#brace-editor',
  InsertConfirm:
    '.insert-document-dialog [role=dialog] > div:nth-child(2) button:first-child',
  ImportModal: '[data-test-id="import-modal"]',
  ImportFileInput: '#import-file_file_input',
  FileTypeJSON: '[data-test-id="select-file-type-json"]',
  ImportConfirm: '[data-test-id="import-modal"] [data-test-id="import-button"]',
  ImportDone: '[data-test-id="import-modal"] [data-test-id="done-button"]',

  // Aggregations tab
  StageContainer: '[data-test-id="stage-container"]',

  stageOperatorOptions: (stageIndex) => {
    return `[data-stage-index="${stageIndex}"] [role="option"]`;
  },
  stageEditor: (stageIndex) => {
    return `#aggregations-stage-editor-${stageIndex}`;
  },
  stagePreviewToolbarTooltip: (stageIndex) => {
    return `[data-stage-index="${stageIndex}"] [data-test-id="stage-preview-toolbar-tooltip"]`;
  },
  stageCollapseButton: (stageIndex) => {
    return `[data-stage-index="${stageIndex}"] button[title="Collapse"]`;
  },
  stageExpandButton: (stageIndex) => {
    return `[data-stage-index="${stageIndex}"] button[title="Expand"]`;
  },
  stageSelectControlInput: (stageIndex, expanded) => {
    const selector = `[data-stage-index="${stageIndex}"] .Select-control input`; // [role="combobox"]

    if (expanded === true) {
      return `${selector}[aria-expanded="true"]`;
    }

    if (expanded === false) {
      return `${selector}[aria-expanded="false"]`;
    }

    return selector;
  },
  stageTextarea: (stageIndex) => {
    return `[data-stage-index="${stageIndex}"] .ace_editor textarea`; // .ace_text-input
  },

  // Schema tab
  AnalyzeSchemaButton: '[data-test-id="analyze-schema-button"]',
  SchemaFieldList: '.schema-field-list',
  AnalysisMessage: '.analysis-message',
  SchemaField: '.schema-field',
  SchemaFieldName: '.schema-field-name',
  SchemaFieldTypeList: '.schema-field-type-list',

  // Explain Plan tab
  ExecuteExplainButton: '[data-test-id="execute-explain-button"]',
  ExplainSummary: '[data-test-id="explain-summary"]',
  ExplainStage: '[data-test-id="explain-stage"]',

  // Indexes tab
  IndexList: '[data-test-id="index-list"]',
  IndexComponent: '[data-test-id="index-component"]',
  NameColumnName: '[data-test-id="name-column-name"]',

  // Validation tab
  AddRuleButton: '[data-test-id="add-rule-button"]',
  ValidationEditor: '[data-test-id="validation-editor"]',
  ValidationActionMessage: '[data-test-id="validation-action-message"]',
  UpdateValidationButton: '[data-test-id="update-validation-button"]',
  ValidationMatchingDocumentsPreview:
    '[data-test-id="validation-content"] [data-test-id="matching-documents"] [data-test-id="document-preview"]',
  ValidationNotMatchingDocumentsPreview:
    '[data-test-id="validation-content"] [data-test-id="notmatching-documents"] [data-test-id="document-preview"]',

  // Find (Documents, Schema and Explain Plan tabs)
  queryBar: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} [data-test-id="query-bar"]`;
  },
  queryBarOptionInputFilter: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} #query-bar-option-input-filter`;
  },
  queryBarOptionInputProject: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} #query-bar-option-input-project`;
  },
  queryBarOptionInputSort: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} #query-bar-option-input-sort`;
  },
  queryBarOptionInputCollation: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} #query-bar-option-input-collation`;
  },
  queryBarOptionInputMaxTimeMS: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} [id="querybar-option-input-Max Time MS"]`;
  },
  queryBarOptionInputSkip: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} #querybar-option-input-skip`;
  },
  queryBarOptionInputLimit: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} #querybar-option-input-limit`;
  },
  queryBarApplyFilterButton: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} ${Selectors.QueryBarApplyFilterButton}`;
  },
  queryBarOptionsToggle: (tabName) => {
    const tabSelector = Selectors.collectionContent(tabName);
    return `${tabSelector} [data-test-id="query-bar-options-toggle"]`;
  },

  // Tabs at the top
  CloseCollectionTab: '[data-test-id="close-collection-tab"]',

  // Export modal
  ExportModal: '[data-test-id="export-modal"]',
  ExportModalQueryText:
    '[data-test-id="export-modal"] [data-test-id="query-viewer-wrapper"] .ace_text-layer',
  ExportModalSelectFieldsButton:
    '[data-test-id="export-modal"] [data-test-id="select-fields-button"]',
  ExportModalSelectOutputButton:
    '[data-test-id="export-modal"] [data-test-id="select-output-button"]',
  ExportModalExportButton:
    '[data-test-id="export-modal"] [data-test-id="export-button"]',
  ExportModalShowFileButton:
    '[data-test-id="export-modal"] [data-test-id="show-file-button"]',
  ExportModalCloseButton:
    '[data-test-id="export-modal"] [data-test-id="close-button"]',
  ExportModalFileText: '[data-test-id="export-modal"] #export-file',

  selectExportFileTypeButton: (fileType, selected) => {
    const selector = `[data-test-id="export-modal"] [data-test-id="select-file-type-${fileType}"]`;

    if (selected === true) {
      return `${selector}[aria-selected="true"]`;
    }

    if (selected === false) {
      return `${selector}[aria-selected="false"]`;
    }

    return selector;
  },
};

module.exports = Selectors;
