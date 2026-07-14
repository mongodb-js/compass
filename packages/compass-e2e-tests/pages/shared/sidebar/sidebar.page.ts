import { BasePage } from '../../base-page.ts';

export class SidebarPage extends BasePage {
  // --- private selectors (folded from helpers/selectors.ts) ---

  // Sidebar shell
  static readonly #Sidebar = '[data-testid="navigation-sidebar"]';
  static readonly #SidebarTitle = '[data-testid="sidebar-title"]';
  static readonly #SidebarNavigationTree =
    '[data-testid="sidebar-navigation-tree"]';
  static readonly #SidebarTreeItems = `${
    SidebarPage.#SidebarNavigationTree
  } [role="treeitem"]`;
  static readonly #SidebarFilterInput = '[data-testid="sidebar-filter-input"]';
  static readonly #DatabaseCollectionPlaceholder =
    '[data-testid="placeholder"]';

  // Connections list (sidebar header + per-row connect buttons)
  static readonly #ConnectionsTitle = '[data-testid="connections-header"]';
  static readonly #SidebarNewConnectionButton =
    '[data-action="add-new-connection"]';
  static readonly #ConnectionsMenuButton =
    '[data-testid="connections-list-title-actions-show-actions"]';
  static readonly #ConnectionsMenu =
    '[data-testid="connections-list-title-actions"]';
  static readonly #CollapseConnectionsButton =
    '[data-testid="connections-list-title-actions-collapse-all-connections-action"]';
  static readonly #NoDeploymentsText = '[data-testid="no-deployments-text"]';
  static readonly #AddNewConnectionButton =
    '[data-testid="add-new-connection-button"]';

  // Per-connection-row menu container + connect controls
  static readonly #ConnectionMenu =
    '[data-testid="sidebar-navigation-item-actions"]';
  static readonly #ConnectButton =
    '[data-testid="sidebar-navigation-item-actions-connection-connect-action"]';
  static readonly #ConnectDropdownButton =
    '[data-testid="lg-split_button-trigger"]';
  static readonly #ConnectInNewWindowButton =
    '[data-action="connection-connect-in-new-window"]';
  static readonly #InUseEncryptionMarker = '[data-action="open-csfle-modal"]';

  // Aggregates
  static readonly #ConnectionItems =
    '[role="treeitem"][aria-level="1"] [data-is-connected]';
  static readonly #ConnectedConnectionItems =
    '[role="treeitem"][aria-level="1"] [data-is-connected=true]';

  // Cross-page selectors temporarily inlined: these belong to ConnectionFormPage
  // (PR 2.3 will absorb them); SidebarPage references them only at the
  // navigation boundary where the sidebar action opens the connection-form modal.
  static readonly #EditConnectionItem =
    '[data-testid="sidebar-navigation-item-actions-edit-connection-action"]';
  static readonly #RemoveConnectionItem =
    '[data-testid="sidebar-navigation-item-actions-remove-connection-action"]';
  static readonly #ConnectionModalTitle =
    '[data-testid="connection-form-modal"] h3';

  // Parameterized locators (private; consumers use the $ accessors below)
  static readonly #sidebarConnection = (connectionName: string) =>
    `${SidebarPage.#Sidebar} [data-connection-name="${connectionName}"]`;
  static readonly #sidebarConnectionButton = (connectionName: string) =>
    `${SidebarPage.#sidebarConnection(
      connectionName
    )} [data-action="connection-connect"]`;
  static readonly #sidebarConnectionDropdownButton = (connectionName: string) =>
    `${SidebarPage.#sidebarConnection(connectionName)} ${
      SidebarPage.#ConnectDropdownButton
    }`;
  static readonly #sidebarConnectionMenuButton = (connectionName: string) =>
    `${SidebarPage.#sidebarConnection(
      connectionName
    )} button[title="Show actions"]`;
  static readonly #connectionItem = (
    connectionName: string,
    { connected }: { connected?: boolean } = {}
  ) => {
    const connectedFilter =
      connected !== undefined
        ? `[data-is-connected="${connected.toString()}"]`
        : '';
    return `[role="treeitem"][aria-level="1"] [data-connection-name="${connectionName}"]${connectedFilter}`;
  };

  // --- element accessors ($ = ChainablePromiseElement) ---

  get $sidebar() {
    return this.browser.$(SidebarPage.#Sidebar);
  }
  get $sidebarTitle() {
    return this.browser.$(SidebarPage.#SidebarTitle);
  }
  get $navigationTree() {
    return this.browser.$(SidebarPage.#SidebarNavigationTree);
  }
  get $filterInput() {
    return this.browser.$(SidebarPage.#SidebarFilterInput);
  }
  get $newConnectionButton() {
    return this.browser.$(SidebarPage.#SidebarNewConnectionButton);
  }
  get $connectionsTitle() {
    return this.browser.$(SidebarPage.#ConnectionsTitle);
  }
  get $connectionsHeaderMenuButton() {
    return this.browser.$(SidebarPage.#ConnectionsMenuButton);
  }
  get $connectionsHeaderMenu() {
    return this.browser.$(SidebarPage.#ConnectionsMenu);
  }
  get $connectionMenu() {
    return this.browser.$(SidebarPage.#ConnectionMenu);
  }
  get $databaseCollectionPlaceholder() {
    return this.browser.$(SidebarPage.#DatabaseCollectionPlaceholder);
  }
  get $noDeploymentsText() {
    return this.browser.$(SidebarPage.#NoDeploymentsText);
  }
  get $addNewConnectionButton() {
    return this.browser.$(SidebarPage.#AddNewConnectionButton);
  }

  $connection(connectionName: string) {
    return this.browser.$(SidebarPage.#sidebarConnection(connectionName));
  }
  $connectButton(connectionName: string) {
    return this.browser.$(SidebarPage.#sidebarConnectionButton(connectionName));
  }
  $connectDropdownButton(connectionName: string) {
    return this.browser.$(
      SidebarPage.#sidebarConnectionDropdownButton(connectionName)
    );
  }
  $connectInNewWindowButton(connectionName: string) {
    return this.$connection(connectionName).$(
      SidebarPage.#ConnectInNewWindowButton
    );
  }
  $connectionMenuButton(connectionName: string) {
    return this.browser.$(
      SidebarPage.#sidebarConnectionMenuButton(connectionName)
    );
  }
  $connectionItem(connectionName: string, opts?: { connected?: boolean }) {
    return this.browser.$(SidebarPage.#connectionItem(connectionName, opts));
  }
  $connectionActionButton(connectionName: string, childSelector: string) {
    return this.$connection(connectionName).$(childSelector);
  }
  $inUseEncryptionMarker(connectionName: string) {
    return this.$connection(connectionName).$(
      SidebarPage.#InUseEncryptionMarker
    );
  }

  // Aggregates
  get $$connections() {
    return this.browser.$$(SidebarPage.#ConnectionItems);
  }
  get $$connectedConnections() {
    return this.browser.$$(SidebarPage.#ConnectedConnectionItems);
  }
  get $$treeItems() {
    return this.browser.$$(SidebarPage.#SidebarTreeItems);
  }

  // --- action methods ---

  async getConnectionIdByName(connectionName: string): Promise<string> {
    const numConnections = await this.browser.$$(
      SidebarPage.#sidebarConnection(connectionName)
    ).length;
    if (numConnections !== 1) {
      throw new Error(
        `Found ${numConnections} connections named ${connectionName}.`
      );
    }
    const connectionId = await this.$connection(connectionName).getAttribute(
      'data-connection-id'
    );
    if (!connectionId) {
      throw new Error(
        `Could not find connection id for connection ${connectionName}`
      );
    }
    return connectionId;
  }

  async selectConnection(connectionName: string): Promise<void> {
    await this.selectConnectionMenuItem(
      connectionName,
      SidebarPage.#EditConnectionItem
    );
    await this.browser.waitUntil(async () => {
      const text = await this.browser
        .$(SidebarPage.#ConnectionModalTitle)
        .getText();
      return text === connectionName;
    });
  }

  async selectConnectionMenuItem(
    connectionName: string,
    itemSelector: string,
    openMenu = true
  ): Promise<void> {
    await this.browser.waitUntil(async () => {
      if (await this.$connectionMenuButton(connectionName).isDisplayed()) {
        return true;
      }
      // It takes some time for connections to load
      await this.$connection(connectionName).waitForDisplayed();

      // workaround for weirdness in the ItemActionControls menu opener icon
      await this.browser.clickVisible(this.$connectionsTitle);
      // Hover over an arbitrary other element to ensure that the second hover
      // will be a fresh one, then hover the target connection.
      await this.$connectionsTitle.moveTo();
      await this.$connection(connectionName).moveTo();
      return false;
    });

    if (openMenu) {
      await this.browser.clickVisible(
        this.$connectionMenuButton(connectionName)
      );
      await this.$connectionMenu.waitForDisplayed();
    }

    await this.browser.clickVisible(itemSelector);
  }

  async hasConnectionMenuItem(
    connectionName: string,
    itemSelector: string,
    openMenu = true
  ): Promise<boolean> {
    await this.browser.waitUntil(async () => {
      if (await this.$connectionMenuButton(connectionName).isDisplayed()) {
        return true;
      }
      await this.$connection(connectionName).waitForDisplayed();
      await this.browser.clickVisible(this.$connectionsTitle);
      await this.$connectionsTitle.moveTo();
      await this.$connection(connectionName).moveTo();
      return false;
    });

    if (openMenu) {
      await this.browser.clickVisible(
        this.$connectionMenuButton(connectionName)
      );
      await this.$connectionMenu.waitForDisplayed();
    }

    return await this.browser.$(itemSelector).isExisting();
  }

  async removeConnection(connectionName: string): Promise<boolean> {
    // Clear any filter so the connection row is visible to act on.
    if (
      (await this.$filterInput.isExisting()) &&
      (await this.$filterInput.getAttribute('aria-disabled')) !== 'true'
    ) {
      await this.browser.clickVisible(this.$filterInput);
      await this.browser.setValueVisible(this.$filterInput, '');
      // wait for a connection to appear; one must, because if there were none
      // the filter field wouldn't exist in the first place
      await this.browser.$(SidebarPage.#SidebarTreeItems).waitForDisplayed();
    }

    const $conn = this.$connection(connectionName);
    if (await $conn.isExisting()) {
      await this.selectConnectionMenuItem(
        connectionName,
        SidebarPage.#RemoveConnectionItem
      );
      await $conn.waitForExist({ reverse: true });
      return true;
    }
    return false;
  }

  async selectConnectionsMenuItem(itemSelector: string): Promise<void> {
    await this.browser.clickVisible(this.$connectionsHeaderMenuButton);
    await this.$connectionsHeaderMenu.waitForDisplayed();
    await this.browser.clickVisible(itemSelector);
  }

  async collapseAllConnections(): Promise<void> {
    await this.browser.clickVisible(SidebarPage.#CollapseConnectionsButton);
  }

  // Scrolls the sidebar tree until the named collection row is rendered (the
  // tree is virtualized, so off-screen items don't exist in the DOM until the
  // viewport reaches them). Returns true if the row became visible.
  //
  // Composes the collection-row selector locally; the canonical
  // `Selectors.sidebarCollection` migrates into SidebarPage in PR 1.1b.
  async scrollToCollection(
    connectionId: string,
    dbName: string,
    collectionName: string
  ): Promise<boolean> {
    return await this.browser.scrollToVirtualItem(
      SidebarPage.#SidebarNavigationTree,
      SidebarPage.#sidebarCollection(connectionId, dbName, collectionName),
      'tree'
    );
  }

  static readonly #sidebarCollection = (
    connectionId: string,
    dbName: string,
    collectionName: string
  ) => {
    if (connectionId) {
      return `${
        SidebarPage.#Sidebar
      } [data-connection-id="${connectionId}"][data-namespace="${dbName}.${collectionName}"]`;
    }
    return `${
      SidebarPage.#Sidebar
    } [data-namespace="${dbName}.${collectionName}"]`;
  };
}
