const { selector } = require('hadron-spectron');


function addWaitSidebarCommands(client) {
  /**
   * Wait for the sidebar to finish loading.
   *
   * @param {String} type - One of database or collection.
   */
  client.addCommand('waitForSidebar', function(type) {
    console.log('waitForSidebar');
    return this.waitForVisibleInCompass(selector('sidebar-' + type));
  });

  /**
   * Wait for the instance refresh to finish.
   */
  client.addCommand('waitForInstanceRefresh', function() {
    console.log('waitForInstanceRefresh');
    const button = selector('instance-refresh-button');
    const icon = `${button} i.fa-spin`;
    return this.waitForVisibleInCompass(icon, true);
  });
}


function addClickSidebarCommands(client) {
  /**
   * toggle the sidebar
   */
  client.addCommand('clickToggleInSidebar', function() {
    const base = selector('toggle-sidebar');
    return this.waitForVisibleInCompass(base).click(base);
  });

  /**
   * Click the instance refresh button in the top right corner of the sidebar.
   */
  client.addCommand('clickInstanceRefreshIcon', function() {
    console.log('clickInstanceRefreshIcon');
    const button = selector('instance-refresh-button');
    return this
      .waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click on a collection in the sidebar.
   *
   * @param {String} name - The full collection name.
   */
  client.addCommand('clickCollectionInSidebar', function(name) {
    console.log('clickCollectionInSidebar');
    const base = `${selector('sidebar-collection')}[title='${name}']`;
    return this.waitForVisibleInCompass(base).click(base);
  });

  /**
   * Click on a database in the sidebar.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('clickDatabaseInSidebar', function(name) {
    console.log('clickDatabaseInSidebar');
    const base = `${selector('sidebar-database')}[title='${name}']`;
    return this.waitForVisibleInCompass(base).click(base);
  });
}


function addGetSidebarCommands(client) {
  /**
   * Get the sidebar database count
   */
  client.addCommand('getSidebarDatabaseCount', function() {
    return this.getText(selector('sidebar-db-count'));
  });

  /**
   * Get the sidebar collection count
   */
  client.addCommand('getSidebarCollectionCount', function() {
    return this.getText(selector('sidebar-collection-count'));
  });

  /**
   * Get a list of database names from the sidebar.
   */
  client.addCommand('getSidebarDatabaseNames', function() {
    return this.waitForSidebar('database').getText(selector('sidebar-database'));
  });

  /**
   * Get a list of collection names from the sidebar.
   */
  client.addCommand('getSidebarCollectionNames', function() {
    return this.getAttribute(selector('sidebar-collection'), 'title');
  });
}


function addInputSidebarCommands(client) {
  /**
   * Input to filter the sidebar's list of databases and collections.
   *
   * @type {String} filter - the filter.
   */
  client.addCommand('inputSidebarFilter', function(filter) {
    const base = selector('sidebar-filter-input');
    return this.setValue(base, filter);
  });
}


/**
 * Add commands to the client related to the Sidebar Tab.
 *
 * @param {Client} client - The client.
 */
function addSidebarCommands(client) {
  addWaitSidebarCommands(client);
  addClickSidebarCommands(client);
  addGetSidebarCommands(client);
  addInputSidebarCommands(client);
}


module.exports = addSidebarCommands;
