export type WorkspaceTabSelectorOptions = {
  id?: string;
  connectionName?: string;
  namespace?: string;
  type?: string;
  active?: boolean;
};

// Settings Modal
export const SettingsModal = '[data-testid="settings-modal"]';
export const CloseSettingsModalButton = `${SettingsModal} [aria-label="Close modal"]`;
export const SaveSettingsButton = `${SettingsModal} [data-testid="submit-button"]`;
export const SettingsModalTabSelector = (name: string) =>
  `${SettingsModal} [data-testid="sidebar-${name}-item"]`;
export const GeneralSettingsButton = SettingsModalTabSelector('general');
export const GeneralSettingsContent = `${SettingsModal} [data-testid="general-settings"]`;

export const SettingsInputElement = (settingName: string): string => {
  return `${SettingsModal} [data-testid="${settingName}"]`;
};

// LG Modals
export const LGModal = '[data-testid="lg-modal"]';
export const LGModalClose = '[data-testid="lg-modal-close_button"]';

// LG Toasts container (these test ids are used by LG in the toast and are not in the code anywhere).
export const LGToastContainer = '[data-testid="lg-toast-scroll-container"]';
export const LGToastCloseButton = '[data-testid="lg-toast-dismiss-button"]';
export const LGToastTitle = '[data-testid="toast-title"]';

// Welcome Modal
export const WelcomeModal = '[data-testid="welcome-modal"]';
export const CloseWelcomeModalButton =
  '[data-testid="welcome-modal"] [aria-label="Close modal"]';

// Connection screen (single connection only)
export const ConnectSection = '[data-testid="connections-wrapper"]';
export const ConnectButton = '[data-testid="connect-button"]';
export const SaveAndConnectButton = '[data-testid="save-and-connect-button"]';
export const CancelConnectionButton =
  '[data-testid="cancel-connection-button"]';
export const ConnectionTitle = '[data-testid="connection-form"] h3';
export const ConnectionEditFavouriteButton =
  '[data-testid="edit-favorite-icon-button"]';

// Connection form (shared by single and multiple connection)
export const ConnectionForm = '[data-testid="connection-form"]';
export const ConnectionFormStringInput =
  'textarea[data-testid="connectionString"]';
export const ConnectionFormAdvancedToggle =
  '[data-testid="advanced-connection-options"]';
export const ConnectionFormGeneralTabButton =
  '[data-testid="connection-general-tab"]';
export const ConnectionFormAuthenticationTabButton =
  '[data-testid="connection-authentication-tab"]';
export const ConnectionFormTLSTabButton = '[data-testid="connection-tls-tab"]';
export const ConnectionFormTLSONButton =
  'label[for="connection-tls-enabled-ON-radio-button"]';
export const ConnectionFormTLSOFFButton =
  'label[for="connection-tls-enabled-OFF-radio-button"]';
export const ConnectionFormInputHost = '#connection-host-input-0';
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
export const ConnectionFormHostInputs = '[data-testid="connection-host-input"]';
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
export const ConnectionFormInputOIDCUsername =
  '[data-testid="connection-oidc-username-input"]';
export const ConnectionFormOIDCAdvancedToggle =
  '[data-testid="oidc-advanced-options"]';
export const ConnectionFormOIDCUseApplicationProxyCheckbox =
  '[data-testid="oidc-use-application-level-proxy"]';
export const ConnectionFormInputAWSAccessKeyId =
  '[data-testid="connection-form-aws-access-key-id-input"]';
export const ConnectionFormInputAWSSecretAccessKey =
  '[data-testid="connection-form-aws-secret-access-key-input"]';
export const ConnectionFormInputAWSSessionToken =
  '[data-testid="connection-form-aws-secret-token-input"]';

export const ConnectionFormInputFLEKeyVaultNamespace =
  '[data-testid="csfle-keyvault"]';
export const ConnectionFormInputFLEStoreCredentialsCheckbox =
  '[data-testid="csfle-store-credentials-input"]';
export const ConnectionFormInputFLELocalKMS =
  '[data-testid="csfle-kms-provider-local"]';
export const connectionFormEditFLEName = (index = 0) =>
  `[data-card-index="${index}"] [data-testid="csfle-edit-kms-name"]`;
export const connectionFormInputFLELocalName = (index = 0) =>
  `[data-card-index="${index}"] [data-testid="csfle-kms-card-name"]`;
export const connectionFormInputFLELocalKey = (index = 0) =>
  `[data-card-index="${index}"] [data-testid="csfle-kms-local-key"]`;
export const ConnectionFormAddNewKMSProviderButton =
  '[data-testid="csfle-add-new-kms-provider-button"]';
export const ConnectionFormInputFLEEncryptedFieldsMap =
  '[data-testid="connection-csfle-encrypted-fields-map"]';
export const ConnectionFormInputFLEEncryptedFieldsMapEditor =
  '[data-testid="encrypted-fields-map-editor"]';

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
  '[data-testid="url-options"] button[name="select-url-options-key-name"]';
export const ConnectionFormUrlOptionValues =
  '[data-testid="url-options"] input[type="text"]';

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
  return `[data-testid="url-options"] [data-testid="url-option-entry-${index}"] button[name="select-url-options-key-name"]`;
};
export const connectionFormUrlOptionValueInput = (index: number): string => {
  return `[data-testid="url-options"] [data-testid="url-option-entry-${index}"] input`;
};

// Connection status modal (single connection only)
export const ConnectionStatusModalContent =
  '[data-testid="connecting-modal-content"]';

// Multiple Connections Modal
export const ConnectionModal = '[data-testid="connection-form-modal"]';
export const ConnectionModalTitle = `${ConnectionModal} h3`;
export const ConnectionModalCloseButton = `${ConnectionModal} [aria-label="Close modal"]`;
export const ConnectionModalConnectButton = '[data-testid="connect-button"]';
export const ConnectionModalSaveButton = '[data-testid="save-button"]';
export const ConnectionFormConnectionName =
  '[data-testid="personalization-name-input"]';
export const ConnectionFormConnectionColor =
  '[data-testid="personalization-color-input"]';
export const ConnectionFormFavoriteCheckbox =
  '[data-testid="personalization-favorite-checkbox"]';
export const connectionToastById = (connectionId: string) => {
  return `[data-testid="toast-connection-status--${connectionId}"]`;
};
export const ConnectionToastErrorText = '[data-testid="connection-error-text"]';
export const ConnectionToastErrorReviewButton =
  '[data-testid="connection-error-review"]';

// Single Connection sidebar
export const Single = {
  ConnectionsTitle: '[data-testid="connections-title"]',
  SidebarNewConnectionButton: '[data-testid="new-connection-button"]',
  FavoriteConnections: '[data-testid="favorite-connection"]',
  FavoriteConnectionsHeader: '[data-testid="favorite-connections-list-header"]',
  ConnectionMenu: '[data-testid="connection-menu"]',
  CopyConnectionStringItem: `[data-testid="connection-menu-copy-connection-string-action"]`,
  EditConnectionItem: `[data-testid="connection-menu-edit-connection-action"]`,
  DuplicateConnectionItem: `[data-testid="connection-menu-duplicate-connection-action"]`,
  RemoveConnectionItem: `[data-testid="connection-menu-remove-connection-action"]`,
  RecentConnections: '[data-testid="recent-connection"]',
  CreateDatabaseButton:
    '[data-testid="sidebar-navigation-item-actions-open-create-database-action"]',
  // for single connections refresh is a button next to add, not a menu item
  RefreshDatabasesButton:
    '[data-testid="sidebar-navigation-item-actions-refresh-databases-action"]',
  ShowTitleActionsButton: '[data-testid="sidebar-title-actions-show-actions"]',
  ClusterInfoItem:
    '[data-testid="sidebar-title-actions-open-connection-info-action"]',
  ConnectionsMenuButton: `[data-testid="favorite-connections-list-header"] button[title="Show actions"]`,
  ConnectionsMenu: '[data-testid="favorites-menu"]',
  ExportConnectionsModalOpen:
    '[data-testid="favorites-menu-export-saved-connections-action"]',
  ImportConnectionsModalOpen:
    '[data-testid="favorites-menu-import-saved-connections-action"]',

  InUseEncryptionMarker: '[data-testid="fle-connection-configuration"]',
};

// Multiple Connections sidebar
export const Multiple = {
  ConnectionsTitle: '[data-testid="connections-header"]',
  ConnectButton: '[data-action="connection-connect"]',
  SidebarNewConnectionButton: '[data-action="add-new-connection"]',
  ConnectionMenu: '[data-testid="sidebar-navigation-item-actions"]',
  CreateDatabaseButton:
    '[data-testid="sidebar-navigation-item-actions-create-database-action"]',
  OpenShellItem:
    '[data-testid="sidebar-navigation-item-actions-open-shell-action"]',
  ViewPerformanceItem:
    '[data-testid="sidebar-navigation-item-actions-connection-performance-metrics-action"]',
  ShowConnectionInfoItem:
    '[data-testid="sidebar-navigation-item-actions-open-connection-info-action"]',
  DisconnectConnectionItem:
    '[data-testid="sidebar-navigation-item-actions-connection-disconnect-action"]',
  EditConnectionItem:
    '[data-testid="sidebar-navigation-item-actions-edit-connection-action"]',
  CopyConnectionStringItem:
    '[data-testid="sidebar-navigation-item-actions-copy-connection-string-action"]',
  UnfavoriteConnectionItem:
    '[data-testid="sidebar-navigation-item-actions-connection-toggle-favorite-action"]',
  DuplicateConnectionItem: `[data-testid="sidebar-navigation-item-actions-duplicate-connection-action"]`,
  RemoveConnectionItem: `[data-testid="sidebar-navigation-item-actions-remove-connection-action"]`,

  // for multiple connections refresh is a menu item, not a button next to add database
  RefreshDatabasesItem:
    '[data-testid="sidebar-navigation-item-actions-refresh-databases-action"]',
  ClusterInfoItem:
    '[data-testid="sidebar-navigation-item-actions-open-connection-info-action"]',
  ConnectionsMenuButton:
    '[data-testid="connections-list-title-actions-show-actions"]',
  ConnectionsMenu: '[data-testid="connections-list-title-actions"]',
  ExportConnectionsModalOpen:
    '[data-testid="connections-list-title-actions-export-saved-connections-action"]',
  ImportConnectionsModalOpen:
    '[data-testid="connections-list-title-actions-import-saved-connections-action"]',

  InUseEncryptionMarker: '[data-action="open-csfle-modal"]',

  ConnectionItems: '[role="treeitem"][aria-level="1"] [data-is-connected]',
  ConnectedConnectionItems:
    '[role="treeitem"][aria-level="1"] [data-is-connected=true]',

  NoDeploymentsText: '[data-testid="no-deployments-text"]',
  AddNewConnectionButton: '[data-testid="add-new-connection-button"]',

  connectionItemByName: (
    connectionName: string,
    { connected }: { connected?: boolean } = {}
  ) => {
    const connectedFilter =
      connected !== undefined
        ? `[data-is-connected="${connected.toString()}"]`
        : '';
    return `[role="treeitem"][aria-level="1"] [data-connection-name="${connectionName}"]${connectedFilter}`;
  },
};

// Rename Collection Modal
export const RenameCollectionModal = '[data-testid="rename-collection-modal"]';
export const RenameCollectionModalInput =
  '[data-testid="rename-collection-name-input"]';
export const RenameCollectionModalConfirmationScreen =
  '[data-testid="rename-collection-confirmation-screen"]';
export const RenameCollectionModalSuccessToast =
  '[data-testid="toast-collection-rename-success"]';
export const RenameCollectionModalSubmitButton =
  '[data-testid="submit-button"]';
export const RenameCollectionModalErrorBanner =
  '[data-testid="rename-collection-modal-error"]';
export const RenameCollectionModalCloseButton = `${RenameCollectionModal} [aria-label="Close modal"]`;

// Database-Collection Sidebar
export const Sidebar = '[data-testid="navigation-sidebar"]';
export const SidebarNavigationTree = '[data-testid="sidebar-navigation-tree"]';
export const SidebarTreeItems = `${SidebarNavigationTree} [role="treeitem"]`;
export const SidebarFilterInput = '[data-testid="sidebar-filter-input"]';
export const SidebarTitle = '[data-testid="sidebar-title"]';
export const SidebarNavigationItemShowActionsButton =
  '[data-testid="sidebar-navigation-item-actions-show-actions"]';
export const RenameCollectionButton =
  '[data-testid="sidebar-navigation-item-actions-rename-collection-action"]';
export const DropDatabaseButton = '[data-action="drop-database"]';
export const CreateCollectionButton = '[data-action="create-collection"]';
export const DatabaseCollectionPlaceholder = '[data-testid="placeholder"]';
export const CollapseConnectionsButton =
  '[data-testid="connections-list-title-actions-collapse-all-connections-action"]';

export const sidebarDatabase = (
  // TODO(COMPASS-7906): don't allow undefined connectionId
  connectionId: string | undefined,
  dbName: string
): string => {
  if (connectionId) {
    return `${Sidebar} [data-connection-id="${connectionId}"][data-database-name="${dbName}"]`;
  }
  return `${Sidebar} [data-database-name="${dbName}"]`;
};

export const sidebarDatabaseToggle = (
  // TODO(COMPASS-7906): don't allow undefined connectionId
  connectionId: string | undefined,
  dbName: string
): string => {
  return `${sidebarDatabase(connectionId, dbName)} button[type=button]`;
};

export const sidebarCollection = (
  // TODO(COMPASS-7906): don't allow undefined connectionId
  connectionId: string | undefined,
  dbName: string,
  collectionName: string
): string => {
  if (connectionId) {
    return `${Sidebar} [data-connection-id="${connectionId}"][data-namespace="${dbName}.${collectionName}"]`;
  }
  return `${Sidebar} [data-namespace="${dbName}.${collectionName}"]`;
};

export const sidebarConnection = (connectionName: string): string => {
  return `${Sidebar} [data-connection-name="${connectionName}"]`;
};

export const sidebarConnectionButton = (connectionName: string): string => {
  return `${sidebarConnection(connectionName)} ${Multiple.ConnectButton}`;
};

export const sidebarConnectionActionButton = (
  connectionName: string,
  selector: string
): string => {
  return `${sidebarConnection(connectionName)} ${selector}`;
};

export const sidebarConnectionMenuButton = (connectionName: string): string => {
  return `${sidebarConnection(connectionName)} button[title="Show actions"]`;
};

export const sidebarFavorite = (favoriteName: string): string => {
  // single connection only
  return `${Single.FavoriteConnections}[data-id="favorite-connection-${favoriteName}"]`;
};

// CSFLE modal
export const SetCSFLEEnabledLabel = '[id="set-csfle-enabled"]';
export const CSFLEConnectionModal = '[data-testid="csfle-connection-modal"]';
export const CSFLEConnectionModalCloseButton = `${CSFLEConnectionModal} [aria-label*="Close"]`;

// Connection Info modal
export const ConnectionInfoModal = '[data-testid="connection-info-modal"]';
export const ConnectionInfoModalCloseButton = `${ConnectionInfoModal} [aria-label*="Close"]`;

// Favorite modal
export const FavoriteModal = '[data-testid="favorite-modal"]';
export const FavoriteNameInput = '[data-testid="favorite-name-input"]';
export const FavoriteColorSelector = '#favorite-color-selector';
export const FavoriteSaveButton =
  '[data-testid="favorite-modal"] [data-testid="submit-button"]';

// Create database modal
export const CreateDatabaseModal = '[data-testid="create-database-modal"]';
export const CreateDatabaseDatabaseName = '[data-testid="database-name"]';
export const CreateDatabaseCollectionName = '[data-testid="collection-name"]';
export const CreateDatabaseErrorMessage =
  '[data-testid="create-database-modal"] [role="alert"]';
export const CreateDatabaseCreateButton =
  '[data-testid="create-database-modal"] [data-testid="submit-button"]';
export const CreateDatabaseCancelButton =
  '[data-testid="create-database-modal"] [data-testid="cancel-button"]';

// Create collection modal
export const CreateCollectionModal = '[data-testid="create-collection-modal"]';
export const CreateCollectionCollectionName = '[data-testid="collection-name"]';
export const CreateCollectionErrorMessage =
  '[data-testid="create-collection-modal"] [role="alert"]';
export const CreateCollectionCreateButton =
  '[data-testid="create-collection-modal"] [data-testid="submit-button"]';
export const CreateCollectionCancelButton =
  '[data-testid="create-collection-modal"] [data-testid="cancel-button"]';
export const CreateCollectionCappedCheckboxLabel =
  '[data-testid="capped-collection-fields"] [data-testid="capped-collection-fields-label"]';
export const CreateCollectionCappedSizeInput =
  '[data-testid="capped-collection-fields"] [data-testid="capped-size"]';
export const CreateCollectionCollectionOptionsAccordion =
  '[data-testid="create-collection-modal"] [data-testid="additional-collection-preferences"]';
export const CreateCollectionCustomCollationCheckboxLabel =
  '[data-testid="use-custom-collation-fields"] [data-testid="use-custom-collation-fields-label"]';

export const CreateCollectionFLE2CheckboxLabel =
  '[data-testid="fle2-fields"] [data-testid="fle2-fields-label"]';
export const CreateCollectionFLE2 = '[data-testid="fle2-fields"]';
export const CollectionListFLE2Badge = '[data-testid="collection-badge-fle2"]';
export const CollectionHeaderFLE2Badge = '[data-testid="collection-badge-fle"]';
export const CreateCollectionFLE2EncryptedFields =
  '[data-testid="fle2-encryptedFields"]';
export const CreateCollectionFLE2KeyEncryptionKey =
  '[data-testid="fle2-keyEncryptionKey"]';

export const CreateCollectionTimeseriesCheckboxLabel =
  '[data-testid="time-series-fields"] [data-testid="time-series-fields-label"]';
export const CreateCollectionTimeseriesTimeField =
  '[data-testid="time-series-fields"] [name="timeSeries.timeField"]';
export const CreateCollectionTimeseriesMetaField =
  '[data-testid="time-series-fields"] [name="timeSeries.metaField"]';
export const CreateCollectionTimeseriesGranularityButton =
  '[data-testid="time-series-fields"] [name="timeSeries.granularity"]';
export const CreateCollectionTimeseriesGranularityMenu =
  '[data-testid="time-series-fields"] #timeSeries-granularity-menu';
export const CreateCollectionTimeseriesBucketMaxSpanSeconds =
  '[data-testid="time-series-fields"] [name="timeSeries.bucketMaxSpanSeconds"]';
export const CreateCollectionTimeseriesBucketRoundingSeconds =
  '[data-testid="time-series-fields"] [name="timeSeries.bucketRoundingSeconds"]';
export const CreateCollectionTimeseriesExpireAfterSeconds =
  '[data-testid="time-series-fields"] [name="expireAfterSeconds"]';

export const CreateCollectionClusteredCheckboxLabel =
  '[data-testid="clustered-collection-fields"] [data-testid="clustered-collection-fields-label"]';
export const CreateCollectionClusteredNameField =
  '[data-testid="clustered-collection-fields"] [name="clusteredIndex.name"]';
export const CreateCollectionClusteredExpireAfterSeconds =
  '[data-testid="clustered-collection-fields"] [name="expireAfterSeconds"]';

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

// Drop namespace modal
export const DropNamespaceModal =
  '[data-testid="drop-namespace-confirmation-modal"]';
export const DropNamespaceConfirmNameInput = `${DropNamespaceModal} input`;
export const DropNamespaceDropButton = `${DropNamespaceModal} button:first-of-type`;
export const DropNamespaceCancelButton = `${DropNamespaceModal} button:last-of-type`;
export const DropNamespaceSuccessToast =
  '[data-testid="toast-drop-namespace-success"]';
export const DropNamespaceSuccessToastCloseButton =
  '[data-testid="toast-drop-namespace-success"] [data-testid="lg-toast-dismiss-button"]';

// Shell
export const ShellSection = '[data-testid="shell-section"]';
export const ShellContent = '[data-testid="shell-content"]';
export const ShellExpandButton = '[data-testid="shell-expand-button"]';
export const ShellInputEditor = '[data-testid="shell-input"] [data-codemirror]';
export const ShellInput = '[data-testid="shell-input"]';
export const ShellOutput = '[data-testid="shell-output"]';

// Instance screen
export const DatabasesTable = '[data-testid="database-grid"]';
export const InstanceCreateDatabaseButton =
  '[data-testid="create-controls"] button';
export const InstanceRefreshDatabaseButton =
  '[data-testid="refresh-controls"] button';
export const DatabaseCard = '[data-testid="database-grid-item"]';
// assume that there's only one hovered card at a time and that the first and only button is the drop button
export const DatabaseCardDrop =
  '[data-testid="database-grid"] [data-testid="namespace-card-actions"] button';
export const ServerStats = '.serverstats';
export const DatabaseStatLoader = `${DatabaseCard} [data-testid="namespace-param-fallback"][data-ready=false]`;

export const databaseCard = (dbName: string): string => {
  return `${DatabaseCard}[data-id="${dbName}"]`;
};

export const databaseCardClickable = (dbName: string): string => {
  // webdriver does not like clicking on the card even though the card has the
  // click handler, so click on the title
  return `${databaseCard(dbName)} [title="${dbName}"]`;
};

// Database screen
export const CollectionsGrid = '[data-testid="collection-grid"]';
export const DatabaseCreateCollectionButton =
  '[data-testid="create-controls"] button';
export const DatabaseRefreshCollectionButton =
  '[data-testid="refresh-controls"] button';
export const CollectionCard = '[data-testid="collection-grid-item"]';
// assume that there's only one hovered card at a time and that the first and only button is the drop button
export const CollectionCardDrop =
  '[data-testid="collection-grid"] [data-testid="namespace-card-actions"] button';

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
export const CollectionTab = '[data-testid="collection-tabs"]';
export const CollectionTabStats = (
  tabName: 'documents' | 'indexes'
): string => {
  return `[data-testid="${tabName}-tab-title"] [data-testid="collection-stats"]`;
};
export const CollectionStatsTooltip =
  '[data-testid="collection-stats-tooltip"]';

export const collectionSubTab = (
  tabName: string,
  selected?: boolean
): string => {
  const tabSelector = `[data-testid="${tabName}-tab-button"]`;

  if (selected === true) {
    return `${CollectionTab} [aria-selected="true"]${tabSelector}`;
  }

  if (selected === false) {
    return `${CollectionTab} [aria-selected="false"]${tabSelector}`;
  }

  return `${CollectionTab} ${tabSelector}`;
};
export const collectionContent = (tabName: string): string => {
  const tn = tabName.toLowerCase().replace(/ /g, '-');
  return `[data-testid="${tn}-content"]`;
};
export const CollectionHeader = '[data-testid="collection-header"]';

// Documents tab
export const DocumentListActionBarMessage =
  '[data-testid="crud-document-count-display"]';
export const ExportCollectionMenuButton =
  '[data-testid="crud-export-collection-show-actions"]';
export const ExportCollectionQueryOption =
  '[data-testid="crud-export-collection-export-query-action"]';
export const ExportCollectionFullCollectionOption =
  '[data-testid="crud-export-collection-export-full-collection-action"]';
export const DocumentListFetching =
  '[data-testid="documents-content"] [data-testid="fetching-documents"]';
export const DocumentListFetchingStopButton =
  '[data-testid="documents-content"] [data-testid="fetching-documents"] button';
export const DocumentListError = '[data-testid="document-list-error-summary"]';
export const AddDataButton = '[data-testid="crud-add-data-show-actions"]';
export const InsertDocumentOption =
  '[data-testid="crud-add-data-insert-document-action"]';
export const ImportFileOption =
  '[data-testid="crud-add-data-import-file-action"]';
export const DocumentListEntry = '[data-testid="editable-document"]';
export const DocumentJSONEntry = '[data-testid="document-json-item"]';
export const DocumentExpandButton = '[data-testid="expand-document-button"]';
export const SelectJSONView = '[data-testid="toolbar-view-json"]';
export const SelectTableView = '[data-testid="toolbar-view-table"]';
export const SelectListView = '[data-testid="toolbar-view-list"]';
export const CopyDocumentButton = '[data-testid="copy-document-button"]';
export const CloneDocumentButton = '[data-testid="clone-document-button"]';
export const DeleteDocumentButton = '[data-testid="remove-document-button"]';
export const DocumentFooter = '[data-testid="document-footer"]';
export const DocumentFooterMessage = '[data-testid="document-footer-message"]';
export const UpdateDocumentButton = `${DocumentFooter} [data-testid="update-button"]`;
export const ConfirmDeleteDocumentButton = `${DocumentFooter} [data-testid="delete-button"]`;
export const JSONDocumentCard = '[data-testid="editable-json"]';
export const JSONEditDocumentButton = `${JSONDocumentCard} [data-testid="editor-action-Edit"]`;
export const ShowMoreFieldsButton = '[data-testid="show-more-fields-button"]';
export const OpenBulkUpdateButton = '[data-testid="crud-update"]';
export const OpenBulkDeleteButton = '[data-testid="crud-bulk-delete"]';

// Insert Document modal

export const InsertDialog = '[data-testid="insert-document-modal"]';
export const InsertDialogErrorMessage =
  '[data-testid="insert-document-banner"][data-variant="danger"]';
export const InsertJSONEditor = '[data-testid="insert-document-json-editor"]';
export const InsertConfirm =
  '[data-testid="insert-document-modal"] [data-testid="submit-button"]';
export const InsertCancel =
  '[data-testid="insert-document-modal"] [data-testid="cancel-button"]';
export const insertCSFLEHasKnownSchemaMsg =
  '[data-testid="insert-csfle-has-known-schema"]';
export const incompleteSchemaForClonedDocMsg =
  '[data-testid="incomplete-schema-for-cloned-doc"]';

// Import File modal

export const ImportModal = '[data-testid="import-modal"]';
export const ImportDelimiterSelect = '[data-testid="import-delimiter-select"]';
export const ImportDelimiterMenu = '[id="import-delimiter-select-menu"]';
export const ImportStopOnErrorsCheckbox =
  '[data-testid="import-stop-on-errors"]';
export const ImportFileInput = '#import-file_file_input';
export const FileTypeJSON = '[data-testid="select-file-type-json"]';
export const FileTypeCSV = '[data-testid="select-file-type-csv"]';
export const ImportSkipAnalyze = '[data-testid="skip-csv-analyze-button"]';
export const ImportAnalyzeError =
  '[data-testid="import-modal"] [data-testid="analyze-error"]';
export const ImportConfirm =
  '[data-testid="import-modal"] [data-testid="import-button"]';
export const ImportToast = '[data-testid="toast-import-toast"]';
export const ImportToastAbort = '[data-testid="toast-action-stop"]';
export const ImportFieldLabel =
  '[data-testid="import-modal"] .import-field-label';
export const ImportModalCloseButton = `${ImportModal} [aria-label*="Close"]`;

export const importPreviewFieldHeaderField = (fieldName: string): string => {
  return `[data-testid="import-preview-field-type-select-menu-${fieldName}"]`;
};
export const importPreviewFieldHeaderSelect = (fieldName: string): string => {
  return `[data-testid="preview-field-header-${fieldName}"] button`;
};
export const importPreviewFieldHeaderSelectMenu = (
  fieldName: string
): string => {
  return `[id="import-preview-field-type-select-menu-${fieldName}-menu"]`;
};

export const importPreviewFieldHeaderCheckbox = (fieldName: string): string => {
  return `[data-testid="preview-field-header-${fieldName}"] [data-testid="toggle-import-field-checkbox-${fieldName}"]`;
};

// Bulk Update Modal
export const BulkUpdateModal = '[data-testid="bulk-update-modal"]';
export const BulkUpdateReadonlyFilter = `${BulkUpdateModal} [data-testid="readonly-filter"]`;
export const BulkUpdateUpdate = `${BulkUpdateModal} [data-testid="bulk-update-update"]`;
export const BulkUpdateTitle = `${BulkUpdateModal} [data-testid="modal-title"]`;
export const BulkUpdateUpdateButton = `${BulkUpdateModal} [data-testid="update-button"]`;
export const BulkUpdateCancelButton = `${BulkUpdateModal} [data-testid="cancel-button"]`;
export const BulkUpdatePreviewDocument = `${BulkUpdateModal} [data-testid="bulk-update-preview-document"]`;
export const BulkUpdateSaveFavorite = `${BulkUpdateModal} [data-testid="inline-save-query-modal-opener"]`;
export const BulkUpdateFavouriteNameInput = `${BulkUpdateModal} [data-testid="inline-save-query-modal-input"]`;
export const BulkUpdateFavouriteSaveButton = `${BulkUpdateModal} [data-testid="inline-save-query-modal-submit"]`;
export const BulkUpdateSuccessToast = `[data-testid="toast-bulk-update-toast"]`;
export const BulkUpdateSuccessToastDismissButton = `[data-testid="toast-bulk-update-toast"] [data-testid="lg-toast-dismiss-button"]`;

// Bulk Delete Modal
export const BulkDeleteModal = '[data-testid="bulk-delete-modal"]';
export const BulkDeleteModalReadonlyFilter = `${BulkDeleteModal} [data-testid="readonly-filter"]`;
export const BulkDeleteModalTitle = `${BulkDeleteModal} [data-testid="modal-title"]`;
export const BulkDeleteModalExportButton = `${BulkDeleteModal} [data-testid="export-button"]`;
export const BulkDeleteModalPreviewTitle = `${BulkDeleteModal} [data-testid="preview-title"]`;
export const BulkDeleteModalDeleteButton = `${BulkDeleteModal} [data-testid="delete-button"]`;
export const BulkDeleteModalCancelButton = `${BulkDeleteModal} [data-testid="cancel-button"]`;
export const BulkDeleteSuccessToast = `[data-testid="toast-bulk-delete-toast"]`;
export const BulkDeleteSuccessToastDismissButton = `[data-testid="toast-bulk-delete-toast"] [data-testid="lg-toast-dismiss-button"]`;

// Connection import/export modals
export const ExportConnectionsModal = '[data-testid="connection-export-modal"]';
export const ExportConnectionsSubmit = `${ExportConnectionsModal} [data-testid="submit-button"]`;
export const ExportConnectionsPassphrase =
  '[data-testid="conn-import-export-passphrase-input"]';
export const ExportConnectionsRemoveSecrets =
  '[data-testid="connection-export-remove-secrets"]';
export const ExportConnectionsSucceededToast =
  '[data-testid="toast-compass-connection-import-export--export-succeeded"]';
export const ImportConnectionsModal = '[data-testid="connection-import-modal"]';
export const ImportConnectionsPassphrase =
  '[data-testid="conn-import-export-passphrase-input"]';
export const ImportConnectionsSucceededToast =
  '[data-testid="toast-compass-connection-import-export--import-succeeded"]';
export const ImportConnectionsSubmit = `${ImportConnectionsModal} [data-testid="submit-button"]`;
export const ExportImportConnectionsFileInput =
  '#conn-import-export-file-input_file_input';
export const closeToastButton = (toastSelector: string) =>
  `${toastSelector} [aria-label="Close Message"]`;

// Hadron document editor

export const HadronDocument = '[data-testid="hadron-document"]';
export const HadronDocumentElement = '[data-testid="hadron-document-element"]';
export const HadronDocumentKey = '[data-testid="hadron-document-element-key"]';
export const HadronDocumentClickableKey =
  '[data-testid="hadron-document-clickable-key"]';
export const HadronDocumentKeyEditor =
  '[data-testid="hadron-document-key-editor"]';
export const HadronDocumentValue =
  '[data-testid="hadron-document-element-value"]';
export const HadronDocumentValueEditor =
  '[data-testid="hadron-document-value-editor"]';
export const HadronDocumentClickableValue =
  '[data-testid="hadron-document-clickable-value"]';
export const HadronDocumentType =
  '[data-testid="hadron-document-element-type"]';
export const HadronDocumentAddElementMenuButton =
  '[data-testid="hadron-document-add-element"]';
export const HadronDocumentAddChildButton =
  '[data-testid="hadron-document-add-child"]';
export const HadronDocumentAddSibling =
  '[data-testid="hadron-document-add-sibling"]';
export const HadronDocumentRevertElement =
  '[data-testid="hadron-document-revert"]';
export const HadronDocumentRemoveElement =
  '[data-testid="hadron-document-remove"]';
export const HadronDocumentElementDecryptedIcon =
  '[data-testid="hadron-document-element-decrypted-icon"]';

// Document list view

export const DocumentListItem = '[data-testid="document-list-item"]';
export const documentListDocument = (n: number): string => {
  return `${DocumentListItem}:nth-child(${n}) ${HadronDocument}`;
};
export const documentListDocumentKey = (n: number): string => {
  return `${DocumentListItem}:nth-child(${n}) ${HadronDocumentKey}`;
};
export const documentListDocumentValue = (n: number): string => {
  return `${DocumentListItem}:nth-child(${n}) ${HadronDocumentValue}`;
};

// Query bar history

export const QueryBarHistoryButton = '[data-testid="query-history-button"]';
export const QueryBarHistory = '[data-testid="query-history"]';

export const QueryHistoryRecentItem = '[data-testid="recent-query-list-item"]';
export const QueryHistoryFavoriteAnItemButton =
  '[data-testid="query-history-button-fav"]';
export const QueryHistoryFavoriteItemNameField =
  '[data-testid="recent-query-save-favorite-name"]';
export const QueryHistorySaveFavoriteItemButton =
  '[data-testid="recent-query-save-favorite-submit"]';
export const SavedItemMenu = '[data-testid="saved-item-actions"]';
export const SavedItemMenuItemCopy = `${SavedItemMenu} [data-testid="saved-item-actions-copy-action"]`;
export const SavedItemMenuItemRename = `${SavedItemMenu} [data-testid="saved-item-actions-rename-action"]`;
export const SavedItemMenuItemDelete = `${SavedItemMenu} [data-testid="saved-item-actions-delete-action"]`;
export const FavouriteQueriesButton = `${QueryBarHistory} [data-testid="past-queries-favorites"] button`;
export const FavouriteQueryListItem = `${QueryBarHistory} [data-testid="favorite-query-list-item"]`;
export const FavouriteQueryTitle = `${QueryBarHistory} [data-testid="query-history-query-title"]`;

export const QueryHistoryFavoritesButton = `[data-testid="past-queries-favorites"]`;
export const QueryHistoryFavoriteItem = `[data-testid="favorite-query-list-item"]`;

export const myQueriesItem = (title: string): string => {
  return `[data-testid="my-queries-list"] [title="${title}"]`;
};

export const MyQueriesList = '[data-testid="my-queries-list"]';

// Aggregations tab
export const StageCard = '[data-testid="stage-card"]';
export const StageCardAtIndex = (idx: number) =>
  `${StageCard}[data-stage-index="${idx}"]`;
export const CreateNewPipelineMenuButton =
  '[data-testid="create-new-menu-show-actions"]';
export const AggregationAdditionalOptionsButton =
  '[data-testid="pipeline-toolbar-options-button"]';
export const AggregationCollationInput = '[data-testid="collation-string"]';
export const AggregationMaxTimeMSInput = '[data-testid="max-time-ms"]';
export const AggregationBuilderWorkspace =
  '[data-testid="pipeline-builder-workspace"]';
export const AggregationBuilderUIWorkspace =
  '[data-testid="pipeline-builder-ui-workspace"]';
export const AggregationAsTextWorkspace =
  '[data-testid="pipeline-as-text-workspace"]';
export const AggregationResultsWorkspace =
  '[data-testid="pipeline-results-workspace"]';
export const AggregationResultsDocumentListSwitchButton =
  '[aria-label="Document list"] button';
export const AggregationResultsJSONListSwitchButton =
  '[aria-label="JSON list"] button';
export const AggregationRestultsPaginationDescription =
  '[data-testid="pipeline-pagination-desc"]';
export const AggregationRestultsNextPageButton =
  '[data-testid="pipeline-pagination-next-action"]';
export const AggregationRestultsPrevPageButton =
  '[data-testid="pipeline-pagination-prev-action"]';
export const AggregationResultsCancelButton =
  '[data-testid="pipeline-results-loader-button"]';
export const AggregationEmptyResults = '[data-testid="pipeline-empty-results"]';
export const AggregationWriteOperationConfirmationModal =
  '[data-testid="write-operation-confirmation-modal"]';
export const AggregationWriteOperationConfirmButton = `${AggregationWriteOperationConfirmationModal} [data-testid*="confirm_button"]`;
export const AggregationWriteOperationCancelButton = `${AggregationWriteOperationConfirmationModal} [data-testid*="cancel_button"]`;
export const AggregationWriteOperationConfirmationModalDescription = `${AggregationWriteOperationConfirmationModal} [data-testid="confirmation-description"]`;

export const AggregationSettingsButton =
  '[data-testid="pipeline-toolbar-settings-button"]';
export const AggregationCommentModeCheckbox = '#aggregation-comment-mode';
export const AggregationSampleSizeInput = '#aggregation-sample-size';
export const AggregationSettingsApplyButton = '#aggregation-settings-apply';
export const AddStageButton = '[data-testid="add-stage"]';
export const ExportAggregationToLanguage =
  '[data-testid="pipeline-toolbar-export-button"]';
export const CreateNewPipelineButton =
  '[data-testid="pipeline-toolbar-create-new-button"]';
export const NewPipelineActions = '#new-pipeline-actions';
export const NewPipelineActionsMenu = `${NewPipelineActions} + [role="menu"]`;
export const SavePipelineMenuButton = '[data-testid="save-menu-show-actions"]';
export const SavePipelineMenuContent = '[data-testid="save-menu"]';
export const SavePipelineCreateViewAction =
  '[data-testid="save-menu-createView-action"]';
export const SavePipelineSaveAsAction =
  '[data-testid="save-menu-saveAs-action"]';
export const AggregationAutoPreviewToggle =
  '[data-testid="pipeline-toolbar-preview-toggle"]';
export const AggregationErrorBanner = '[data-testid="pipeline-results-error"]';

export const RunPipelineButton = `[data-testid="pipeline-toolbar-run-button"]`;
export const EditPipelineButton = `[data-testid="pipeline-toolbar-edit-button"]`;
export const GoToCollectionButton = `[data-testid="pipeline-results-go-to-collection"]`;
export const ExportAggregationResultsButton = `[data-testid="pipeline-toolbar-export-aggregation-button"]`;

export const AggregationOpenSavedPipelinesButton = `[data-testid="pipeline-toolbar-open-pipelines-button"]`;
export const AggregationSavedPipelinesPopover = `[data-testid="saved-pipelines"]`;
export const AggregationSavedPipelineCard = (name: string): string => {
  return `[data-testid="saved-pipeline-card"][data-pipeline-object-name="${name}"]`;
};
export const AggregationSavedPipelineCardOpenButton = (
  name: string
): string => {
  return `${AggregationSavedPipelineCard(
    name
  )} [data-testid="saved-pipeline-card-open-action"]`;
};
export const AggregationSavedPipelineCardDeleteButton = (
  name: string
): string => {
  return `${AggregationSavedPipelineCard(
    name
  )} [data-testid="saved-pipeline-card-delete-action"]`;
};

export const AggregationExplainButton =
  '[data-testid="pipeline-toolbar-explain-aggregation-button"]';
export const AggregationExplainModal = '[data-testid="explain-plan-modal"]';
export const AggregationExplainModalCloseButton = `${AggregationExplainModal} [aria-label*="Close"]`;

// Create view from pipeline modal
export const CreateViewModal = '[data-testid="create-view-modal"]';
export const CreateViewNameInput = `${CreateViewModal} [data-testid="create-view-name"]`;

// Save aggregation from pipeline modal
export const SavePipelineModal = '[data-testid="save-pipeline-modal"]';
export const SavePipelineNameInput = '#save-pipeline-name';

export const stageOperatorOptions = (stageIndex: number): string => {
  return `.mongodb-compass-stage-operator-combobox-${stageIndex} [role="option"]`;
};
export const stageEditor = (stageIndex: number): string => {
  return `#aggregations-stage-editor-${stageIndex}`;
};
export const stagePreview = (stageIndex: number): string => {
  return `[data-testid="stage-preview-${stageIndex}"]`;
};
export const stagePreviewToolbarTooltip = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-testid="stage-preview-toolbar-tooltip"]`;
};
export const stagePreviewEmpty = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-testid="stage-preview-empty"]`;
};
export const stageCollapseButton = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] button[title="Collapse"]`;
};
export const stageExpandButton = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] button[title="Expand"]`;
};
export const stageFocusModeButton = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-testid="focus-mode-button"]`;
};
export const stagePickerComboboxInput = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-testid="stage-operator-combobox"] [role="combobox"] input`;
};
export const stagePickerListBox = (stageIndex: number): string => {
  return `.mongodb-compass-stage-operator-combobox-${stageIndex} [role="listbox"]`;
};
export const stageValueEditor = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] .cm-content`;
};
export const stageContent = (stageIndex: number): string => {
  return stageValueEditor(stageIndex);
};
export const stageAdd = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-testid="add-after-stage"]`;
};
export const stageToggle = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] #toggle-stage-button`;
};
export const stageMoreOptions = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-testid="stage-option-menu-button"]`;
};
export const StageMoreOptionsContent = `[data-testid="stage-option-menu-content"]`;

export const StageDelete = `[data-testid="stage-option-menu-content"] [data-text="Delete stage"]`;
export const StagePreviewDocsExpand = `[data-testid="stage-option-menu-content"] [data-text="Expand documents"]`;
export const StagePreviewDocsCollapse = `[data-testid="stage-option-menu-content"] [data-text="Collapse documents"]`;

// Focus Mode
export const FocusModeModal = '[data-testid="focus-mode-modal"]';
export const FocusModeStageInput = `${FocusModeModal} [data-testid="stage-input"]`;
export const FocusModeStageEditor = `${FocusModeModal} [data-testid="stage-editor"]`;
export const FocusModeStageOutput = `${FocusModeModal} [data-testid="stage-output"]`;
export const focusModeOutputOptionBtn = (
  location: 'stage-input' | 'stage-output'
) =>
  `${FocusModeModal} [data-testid="${location}"] [data-testid="pipeline-output-options-show-actions"]`;
export const FocusModeCloseModalButton = `${FocusModeModal} [aria-label="Close modal"]`;
export const FocusModePreviousStageButton = `${FocusModeModal} [data-testid="previous-stage-button"]`;
export const FocusModeNextStageButton = `${FocusModeModal} [data-testid="next-stage-button"]`;
export const FocusModeActiveStageLabel = `${FocusModeModal} [data-testid="stage-select"]`;
export const FocusModeAddStageMenuButton = `${FocusModeModal} [data-testid="add-stage-menu-button"]`;
export const FocusModeAddStageBeforeMenuItem = `[data-testid="add-stage-menu-content"] [data-text="Add stage before"]`;
export const FocusModeAddStageAfterMenuItem = `[data-testid="add-stage-menu-content"] [data-text="Add stage after"]`;

export const stageEditorErrorMessage = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-testid="stage-editor-error-message"]`;
};
export const stageEditorSyntaxErrorMessage = (stageIndex: number): string => {
  return `[data-stage-index="${stageIndex}"] [data-testid="stage-editor-syntax-error"]`;
};

export const aggregationPipelineModeToggle = (
  mode: 'builder-ui' | 'as-text'
): string => {
  return `[data-testid="pipeline-builder-toggle-${mode}"] button`;
};

export const AggregationAsTextEditor = '[data-testid="pipeline-text-editor"]';
export const AggregationAsTextErrorContainer =
  '[data-testid="pipeline-as-text-error-container"]';
export const AggregationAsTextPreview =
  '[data-testid="pipeline-as-text-preview"]';
export const AggregationAsTextPreviewDocument =
  '[data-testid="readonly-document"]';
export const AggregationAsTextPreviewOut =
  '[data-testid="$out-preview-banner"]';
export const AggregationAsTextPreviewMerge =
  '[data-testid="$merge-preview-banner"]';
export const AggregationAsTextPreviewAtlasOperator =
  '[data-testid="stage-preview-missing-search-support"]';
export const AggregationAsTextShowActionsBtn = `${AggregationAsTextPreview} [data-testid="pipeline-output-options-show-actions"]`;
export const PipelineResultsShowActionsBtn = `[data-testid="pipeline-results-header"] [data-testid="pipeline-output-options-show-actions"]`;
export const PipelineOutputOptionsMenu =
  '[data-testid="pipeline-output-options"]';
export const PipelineOutputOption = (optionText: 'expand' | 'collapse') =>
  `${PipelineOutputOptionsMenu} [data-testid="pipeline-output-options-${optionText}-action"]`;

// Aggregation Wizard
export const AggregationSidePanelToggleButton =
  '[data-testid="pipeline-toolbar-side-panel-button"]';
export const AggregationSidePanel = '[data-testid="aggregation-side-panel"]';
export const AggregationWizardUseCases = `${AggregationSidePanel} [data-testid^="use-case-"]`;
export const AggregationWizardUseCase = (id: string) =>
  `${AggregationSidePanel} [data-testid="use-case-${id}"]`;

export const AggregationWizardCard = '[data-testid="wizard-card"]';
export const AggregationWizardCardAtIndex = (idx: number) =>
  `[data-testid="wizard-card"][data-wizard-index="${idx}"]`;
export const AggregationWizardDismissButton =
  '[data-testid="wizard-cancel-action"]';
export const AggregationWizardApplyButton =
  '[data-testid="wizard-apply-action"]';

export const AggregationWizardSortForm = (idx: number) =>
  `${AggregationWizardCard} [data-testid="sort-form-${idx}"]`;
export const AggregationWizardSortFormField = (idx: number) =>
  `${AggregationWizardSortForm(
    idx
  )} [data-testid="sort-form-${idx}-field"] [role="combobox"] input`;
export const AggregationWizardSortFormDirectionSelect = (idx: number) =>
  `${AggregationWizardSortForm(
    idx
  )} [data-testid="sort-form-${idx}-direction"]`;

// Schema tab
export const AnalyzeSchemaButton = '[data-testid="analyze-schema-button"]';
export const SchemaFieldList = '[data-testid="schema-field-list"]';
export const AnalysisMessage =
  '[data-testid="schema-content"] [data-testid="schema-analysis-message"]';
export const SchemaField = '[data-testid="schema-field"';
export const SchemaFieldName = '[data-testid="schema-field-name"]';
export const SchemaFieldTypeList = '[data-testid="schema-field-type-list"]';

// Explain Plan modal
export const ExecuteExplainButton = '[data-testid="query-bar-explain-button"]';
export const ExplainLoader = '[data-testid="explain-plan-loading"]';
export const ExplainSummary = '[data-testid="explain-plan-summary"]';
export const ExplainStage = '[data-testid="explain-stage"]';
export const ExplainCloseButton = '[data-testid="explain-close-button"]';
export const explainPlanSummaryStat = (
  stat:
    | 'docsReturned'
    | 'docsExamined'
    | 'executionTimeMs'
    | 'sortedInMemory'
    | 'indexKeysExamined'
) => {
  return `${ExplainSummary} [data-testid="${stat}"]`;
};

// Indexes tab
type IndexesType = 'regular-indexes' | 'search-indexes';
export const IndexList = '[data-testid="indexes-list"]';
export const indexComponent = (name: string): string => {
  return `[data-testid="indexes-row-${name}"]`;
};
export const IndexFieldName = '[data-testid="indexes-name-field"]';
export const IndexFieldType = '[data-testid="indexes-type-field"]';
export const IndexPropertyInProgress = '[data-testid="index-in-progress"]';
export const IndexToggleOptions =
  '[data-testid="create-index-modal-toggle-options"]';
export const indexToggleOption = (fieldName: string) => {
  return `[data-testid="create-index-modal-${fieldName}-label"]`;
};
export const indexOptionInput = (
  fieldName: string,
  type: 'code' | 'text' | 'number' | 'checkbox' = 'text'
) => {
  return `[data-testid="create-index-modal-${fieldName}-${type}"]`;
};

export const indexesSegmentedTab = (name: IndexesType) => {
  return `[data-testid="indexes-segment-controls"] [data-testid="${name}-tab"] button`;
};

// Search Index
export const SearchIndexList = '[data-testid="search-indexes"]';
export const SearchIndexModal = '[data-testid="search-index-modal"]';
export const SearchIndexName = '[data-testid="name-of-search-index"]';
export const SearchIndexDefinition =
  '[data-testid="definition-of-search-index"]';
export const SearchIndexConfirmButton =
  '[data-testid="search-index-submit-button"]';
export const searchIndexRow = (name: string) =>
  `[data-testid="search-indexes-row-${name}"]`;
export const searchIndexExpandButton = (name: string) =>
  `${searchIndexRow(name)} button:first-child`;
export const searchIndexAggregateButton = (name: string) =>
  `${searchIndexRow(
    name
  )} [data-testid="search-index-actions-aggregate-action"]`;
export const searchIndexDropButton = (name: string) =>
  `${searchIndexRow(name)} [data-testid="search-index-actions-drop-action"]`;
export const searchIndexEditButton = (name: string) =>
  `${searchIndexRow(name)} [data-testid="search-index-actions-edit-action"]`;
export const searchIndexDetails = (name: string) =>
  `[data-testid="search-indexes-details-${name}"]`;

// Indexes modal
export const CreateIndexModal = '[data-testid="create-index-modal"]';
export const CreateIndexButton =
  '[data-testid="open-create-index-modal-button"]';
export const CreateIndexDropdownButton =
  '[data-testid="multiple-index-types-creation-dropdown-show-actions"]';
export const createIndexDropdownAction = (type: IndexesType) => {
  const action =
    type === 'regular-indexes' ? 'createRegularIndex' : 'createSearchIndex';
  return `[data-testid="multiple-index-types-creation-dropdown-${action}-action"]`;
};
export const createIndexModalFieldNameSelectInput = (idx: number): string => {
  return `[data-testid="create-index-fields-name-${idx}"] input`;
};
export const createIndexModalFieldTypeSelectButton = (idx: number): string => {
  return `[data-testid="create-index-fields-type-${idx}"] button`;
};
export const createIndexModalFieldTypeSelectMenu = (idx: number): string => {
  return `#create-index-fields-type-select-${idx}-menu`;
};

export const CreateIndexErrorMessage = `${CreateIndexModal} [role="alert"]`;
export const CreateIndexConfirmButton = `${CreateIndexModal} [data-testid="create-index-actions-create-index-button"]`;

export const IndexesTableDropIndexButton =
  '[data-testid="index-actions-delete-action"]';
export const DropIndexModal = '[data-testid="drop-index-modal"]';
export const DropIndexModalConfirmNameInput = `${DropIndexModal} input`;
export const DropIndexModalConfirmButton = `${DropIndexModal} button:first-of-type`;

export const HiddenIndexBadge = (indexName: string) =>
  `${indexComponent(indexName)} [data-testid="HIDDEN-badge"]`;
export const HideIndexModal = '[data-testid="hide-index-confirmation-modal"]';
export const HideIndexButton = '[data-testid="index-actions-hide-action"]';

export const UnhideIndexModal =
  '[data-testid="unhide-index-confirmation-modal"]';
export const UnhideIndexButton = '[data-testid="index-actions-unhide-action"]';

// Validation tab
export const AddRuleButton = '[data-testid="add-rule-button"]';
export const ValidationEditor = '[data-testid="validation-editor"]';
export const ValidationActionMessage =
  '[data-testid="validation-action-message"]';
export const UpdateValidationButton =
  '[data-testid="update-validation-button"]';
export const ValidationMatchingDocumentsPreview =
  '[data-testid="validation-content"] [data-testid="matching-documents"] [data-testid="document-preview"]';
export const ValidationLoadMatchingDocumentsBtn = `${ValidationMatchingDocumentsPreview} [data-testid="load-sample-document"]`;
export const ValidationNotMatchingDocumentsPreview =
  '[data-testid="validation-content"] [data-testid="notmatching-documents"] [data-testid="document-preview"]';
export const ValidationLoadNotMatchingDocumentsBtn = `${ValidationNotMatchingDocumentsPreview} [data-testid="load-sample-document"]`;
export const ValidationActionSelector =
  '[data-testid="validation-action-selector"]';
export const ValidationLevelSelector =
  '[data-testid="validation-level-selector"]';

// Find (Documents and Schema tabs)
export const queryBar = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar"]`;
};
export const queryBarOptionInputFilter = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-option-filter-input"]`;
};
export const queryBarOptionInputProject = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-option-project-input"]`;
};
export const queryBarOptionInputSort = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-option-sort-input"]`;
};
export const queryBarOptionInputCollation = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-option-collation-input"]`;
};
export const queryBarOptionInputMaxTimeMS = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-option-maxTimeMS-input"]`;
};
export const queryBarOptionInputSkip = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-option-skip-input"]`;
};
export const queryBarOptionInputLimit = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-option-limit-input"]`;
};
export const queryBarApplyFilterButton = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-apply-filter-button"]`;
};
export const queryBarOptionsToggle = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-options-toggle"]`;
};
export const queryBarResetFilterButton = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-reset-filter-button"]`;
};
export const queryBarExportToLanguageButton = (tabName: string): string => {
  const tabSelector = collectionContent(tabName);
  return `${tabSelector} [data-testid="query-bar-open-export-to-language-button"]`;
};
export const QueryBarAIEntryButton =
  '[data-testid="open-ai-query-entry-button"]';
export const QueryBarAITextInput = '[data-testid="ai-user-text-input"]';
export const QueryBarAIGenerateQueryButton =
  '[data-testid="ai-generate-button"]';
export const QueryBarAIErrorMessageBanner = '[data-testid="ai-error-msg"]';

// Workspace tabs
export const WorkspaceTabsContainer =
  '[data-testid="workspace-tabs-container"]';
export const WorkspaceTabTooltip = '[data-testid=workspace-tab-tooltip]';
export const CloseWorkspaceTab = '[data-testid="close-workspace-tab"]';
export const sidebarInstanceNavigationItem = (
  tabName: 'Performance' | 'Databases'
) => {
  return `${Sidebar} [aria-label="${tabName}"]`;
};
export const SidebarMyQueriesTab = `${Sidebar} [aria-label="My Queries"]`;
export const WorkspaceTab =
  '[role="tablist"][aria-label="Workspace Tabs"] [role="tab"]';
export const workspaceTab = ({
  id,
  connectionName,
  namespace,
  type,
  active,
}: WorkspaceTabSelectorOptions = {}) => {
  const parts: string[] = [WorkspaceTab];
  if (id !== undefined) {
    parts.push(`[id="${id}"]`);
  }
  if (connectionName !== undefined) {
    parts.push(`[data-connection-name="${connectionName}"]`);
  }
  if (namespace !== undefined) {
    parts.push(`[data-namespace="${namespace}"]`);
  }
  if (type !== undefined) {
    parts.push(`[data-type="${type}"]`);
  }
  if (active !== undefined) {
    parts.push(`[aria-selected="${String(active)}"]`);
  }
  return parts.join('');
};

// Export modal
export const ExportModal = '[data-testid="export-modal"]';
export const ExportModalCodePreview =
  '[data-testid="export-modal"] [data-testid="export-collection-code-preview-wrapper"]';
export const ExportQuerySelectFieldsOption =
  '[data-testid="export-modal"] label[for="export-query-select-fields-option"]';
export const ExportQueryAllFieldsOption =
  '[data-testid="export-modal"] label[for="export-query-all-fields-option"]';
export const ExportNextStepButton =
  '[data-testid="export-modal"] [data-testid="export-next-step-button"]';
export const ExportJSONFormatAccordion =
  '[data-testid="export-modal"] [data-testid="export-advanced-json-format"]';
export const ExportJSONFormatCanonical =
  '[data-testid="export-modal"] [data-testid="export-json-format-canonical"]';
export const ExportModalExportButton =
  '[data-testid="export-modal"] [data-testid="export-button"]';
export const ExportToast = '[data-testid="toast-export-toast"]';
export const ExportToastAbort =
  '[data-testid="toast-export-toast"] [data-testid="toast-action-stop"]';
export const ExportToastShowFile =
  '[data-testid="toast-export-toast"] [data-testid="toast-action-show file"]';

export const exportModalExportField = (fieldName: string): string => {
  return `[data-testid="export-modal"] input[type="checkbox"][name="${fieldName}"]`;
};

// Export to language modal
export const ExportToLanguageModal = '[data-testid="export-to-language-modal"]';
export const ExportToLanguageLanguageField =
  '[data-testid="export-to-language-output-field"] button[aria-labelledby="Language Picker"]';
export const ExportToLanguageLanguageListbox =
  'ul[aria-labelledby="Language Picker"]';
export const ExportToLanguageImportsCheckbox =
  '[data-testid="export-to-language-include-imports"]';
export const ExportToLanguageDriverCheckbox =
  '[data-testid="export-to-language-include-drivers"]';
export const ExportToLanguageBuildersCheckbox =
  '[data-testid="export-to-language-use-builders"]';
export const ExportToLanguageCopyOutputButton =
  '[data-testid="export-to-language-output-field"] [aria-label="Copy"]';
export const ExportToLanguageCloseButton = `${ExportToLanguageModal} [data-testid=close-button]`;
export const ExportToLanguageQueryOutput =
  '[data-testid="export-to-language-output"]';

// Confirmation modal
export const ConfirmationModal = '[data-testid="confirmation-modal"]';
export const ConfirmationModalHeading = `${ConfirmationModal} h1`;
export const ConfirmationModalInput = `${ConfirmationModal} input`;

export const confirmationModalConfirmButton = (
  modalSelector = ConfirmationModal
) => `${modalSelector} [role=dialog] button:nth-of-type(1)`;

export const confirmationModalCancelButton = (
  modalSelector = ConfirmationModal
) => `${modalSelector} [role=dialog] button:nth-of-type(2)`;

// New pipeline from text modal
export const NewPipelineFromTextModal = '[data-testid="import-pipeline-modal"]';
export const NewPipelineFromTextEditor = '#import-pipeline-editor';
export const NewPipelineFromTextConfirmButton =
  '[data-testid="import-pipeline-modal"] [data-testid="submit-button"]';

// Confirm import pipeline modal
export const ConfirmImportPipelineModal =
  '[data-testid="confirm-import-pipeline-modal"]';
export const ConfirmImportPipelineModalConfirmButton =
  '[data-testid="confirm-import-pipeline-modal"] [role=dialog] > div:nth-child(2) button:first-child';

// Shell info modal
export const ShellInfoButton = '[data-testid="shell-info-button"]';
export const ShellInfoModal = '[data-testid="shell-info-modal"]';
export const ShellInfoModalCloseButton =
  '[data-testid="shell-info-modal"] [aria-label*="Close"]';

// Edit connection string modal
export const EditConnectionStringToggle =
  '[data-testid="toggle-edit-connection-string"]';

// Rename saved item
export const RenameSavedItemModal = '[data-testid="edit-item-modal"]';
export const RenameSavedItemModalTextInput = `${RenameSavedItemModal} input[name="name"]`;
export const RenameSavedItemModalSubmit = `${RenameSavedItemModal} button[type="submit"]`;

// Open saved item
export const OpenSavedItemModal = '[data-testid="open-item-modal"]';
export const OpenSavedItemConnectionField = `${OpenSavedItemModal} [data-testid="connection-select-field"]`;
export const OpenSavedItemDatabaseField = `${OpenSavedItemModal} [data-testid="database-select-field"]`;
export const OpenSavedItemCollectionField = `${OpenSavedItemModal} [data-testid="collection-select-field"]`;
export const OpenSavedItemModalConfirmButton = `${OpenSavedItemModal} button[type="submit"]`;

// Select connection
export const SelectConnectionModal = '[data-testid="select-connection-modal"]';
export const selectConnectionRadioButton = function (connectionId: string) {
  return `${SelectConnectionModal} input[data-testid="connection-item-${connectionId}"]`;
};
export const SelectConnectionModalConfirmButton = `${SelectConnectionModal} [data-testid="submit-button"]`;

// Duplicate view modal
export const DuplicateViewModal = '[data-testid="create-view-modal"]';
export const DuplicateViewModalTextInput = `${DuplicateViewModal} [data-testid="create-view-name"]`;
export const DuplicateViewModalConfirmButton = `${DuplicateViewModal} button[type="submit"]`;

// Modify view
export const ModifySourceBanner = '[data-testid="modify-source-banner"]';

// Insights
export const InsightIconButton = '[data-testid="insight-badge-button"]';
export const InsightPopoverCard = '[data-testid="insight-signal-card"]';

// Atlas login
export const LogInWithAtlasButton = 'button=Log in with Atlas';
export const LogInWithAtlasModalButton = 'button*=Log in to Atlas';
export const DisconnectAtlasAccountButton = 'button=Log Out';
export const AtlasLoginStatus = '[data-testid="atlas-login-status"]';
export const AtlasLoginErrorToast = '#atlas-sign-in-error';
export const AgreeAndContinueButton = 'button=Agree and continue';

// Proxy settings
export const ProxyUrl =
  '[data-testid="proxy-settings"] [data-testid="proxy-url"]';
export const ProxyCustomButton =
  '[data-testid="proxy-settings"] [data-testid="custom-radio"]';

// Close tab confirmation
export const ConfirmTabCloseModal = '[data-testid="confirm-tab-close"]';

export const GlobalWrites = {
  tabStatus: (status: string) =>
    `[data-testid="globalwrites-content"] > [data-status="${status.toLowerCase()}"]`,

  ShardKeyFormSecondKeyInputCombobox:
    '[data-testid="second-shard-key"] [role="combobox"] input',
  ShardKeyFormAdvancedOptionsToggle:
    '[data-testid="advanced-shard-key-configuration"]',
  shardKeyFormIndexType: (type: 'UNIQUE' | 'HASHED') =>
    `[data-testid="${type.toLowerCase()}-index"]`,
  ShardKeyFormSubmitButton: '[data-testid="shard-collection-button"]',

  CancelShardingButton: '[data-testid="cancel-sharding-btn"]',
  UnmanageNamespaceButton: '[data-testid="unmanage-collection-button"]',
  ManageNamespaceButton: '[data-testid="manage-collection-button"]',

  SampleFindingDocuments: '[data-testid="sample-finding-documents"]',
  SampleInsertingDocuments: '[data-testid="sample-inserting-documents"]',
};
