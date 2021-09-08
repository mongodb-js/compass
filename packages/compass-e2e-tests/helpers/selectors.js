module.exports = {
  ConnectSection: '[data-test-id="connect-section"]',
  PrivacySettingsModal: '[data-test-id="privacy-settings-modal"]',
  ClosePrivacySettingsButton: '[data-test-id="close-privacy-settings-button"]',
  FeatureTourModal: '[data-test-id="feature-tour-modal"]',
  CloseFeatureTourModal: '[data-test-id="close-tour-button"]',
  ConnectButton: '[data-test-id="connect-button"]',
  DatabasesTable: '[data-test-id="databases-table"]',
  ConnectionStringInput: 'input[name="connectionString"]',
  CancelConnectionButton: '[data-test-id="cancel-connection-button"]',
  ConnectionStatusModalContent: '[data-test-id="connecting-modal-content"]',
  SidebarCollection: '[data-test-id="sidebar-collection"]',
  SidebarFilterInput: '[data-test-id="sidebar-filter-input"]',
  SidebarNewConnectionButton: '[data-test-id="new-connection-button"]',
  ShellContent: '[data-test-id="shell-content"]',
  ShellExpandButton: '[data-test-id="shell-expand-button"]',
  ShellInput: '[data-test-id="shell-content"] .ace_content',
  ShellOutput:
    '[data-test-id="shell-content"] [class^=mongosh-shell-output-line] pre',
  ShellLoader:
    '[data-test-id="shell-loader-in-progress"] [name="shell-loader-in-progress-text"]',
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
  CollectionHeaderTitle: '[data-test-id="collection-header-title"]',
  CollectionTab: '.test-tab-nav-bar-tab',
  QueryBarApplyFilterButton: '[data-test-id="query-bar-apply-filter-button"]',
};
