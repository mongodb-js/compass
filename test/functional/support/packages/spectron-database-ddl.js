const selector = require('../spectron-selector');


function addWaitDatabaseDDLCommands(client) {
  /**
   * Waits for the create database modal to open.
   */
  client.addCommand('waitForCreateDatabaseModal', function() {
    return this.waitForVisibleInCompass(selector('create-database-modal'));
  });

  /**
   * Waits for the drop database modal to open.
   */
  client.addCommand('waitForDropDatabaseModal', function() {
    return this.waitForVisibleInCompass(selector('drop-database-modal'));
  });

  /**
   * Wait for the database with the provided name to be created.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('waitForDatabaseCreation', function(name) {
    const base = selector('databases-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExistInCompass(row);
  });

  /**
   * Wait for the database with the provided name to be deleted.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('waitForDatabaseDeletion', function(name) {
    const base = selector('databases-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExistInCompass(row, true);
  });

  client.addCommand('waitForCreateDatabasesModalHidden', function() {
    return this.waitForVisibleInCompass(selector('create-database-modal'), true);
  });

  client.addCommand('waitForDropDatabasesModalHidden', function() {
    return this.waitForVisibleInCompass(selector('drop-database-modal'), true);
  });

  /**
   * Wait until database is deleted
   */
  client.addCommand('waitUntilDatabaseDeletion', function(name) {
    return this.waitUntilInCompass(() => {
      return client.getDatabasesTabDatabaseNames().then((databases) => {
        return !databases.includes(name);
      });
    });
  });
}


function addClickDatabaseDDLCommands(client) {
    /**
   * Click the create database button.
   */
  client.addCommand('clickCreateDatabaseButton', function() {
    return this.waitForStatusBar().click(selector('open-create-database-modal-button'));
  });

  /**
   * Click the LAST delete database trash icon in the list.
   *
   * @param {String} name - The name of the database to delete.
   */
  client.addCommand('clickDeleteDatabaseButton', function(name) {
    const base = selector('databases-table');
    const wrapper = selector('sortable-table-delete');
    const button = `${base} ${wrapper}[title='Delete ${name}']`;
    return this.waitForVisibleInCompass(base).click(button);
  });

  /**
   * Click the create database button in the modal.
   */
  client.addCommand('clickCreateDatabaseModalButton', function() {
    const base = selector('create-database-button');
    return this.click(base);
  });

  /**
   * Click the drop database button in the modal.
   */
  client.addCommand('clickDropDatabaseModalButton', function() {
    const base = selector('drop-database-button');
    return this.click(base);
  });
}


function addInputDatabaseDDLCommands(client) {
  /**
   * Input the database details for creating a database.
   *
   * @param {Object} model - { name: 'dbname', collectionName: 'collName' }
   */
  client.addCommand('inputCreateDatabaseDetails', function(model) {
    return this
      .setValue('#create-database-name', model.name)
      .setValue('#create-database-collection-name', model.collectionName);
  });

  /**
   * Enter the database name to drop.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('inputDropDatabaseName', function(name) {
    return this.setValue(selector('confirm-drop-database-name'), name);
  });
}


/**
 * Add commands to the client related to the Database DDL.
 *
 * @param {Client} client - The client.
 */
function addDatabaseDDLCommands(client) {
  addWaitDatabaseDDLCommands(client);
  addClickDatabaseDDLCommands(client);
  addInputDatabaseDDLCommands(client);
}


module.exports = addDatabaseDDLCommands;
