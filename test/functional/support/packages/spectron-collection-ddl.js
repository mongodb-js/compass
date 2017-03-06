const selector = require('../spectron-selector');


function addWaitCollectionDDLCommands(client) {
  /**
   * Wait for the collection with the provided name to be created.
   *
   * @param {String} name - The collection name.
   */
  client.addCommand('waitForCollectionCreation', function(name) {
    const base = selector('collections-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExistInCompass(row);
  });

  /**
   * Wait for the collection with the provided name to be deleted.
   *
   * @param {String} name - The collection name.
   */
  client.addCommand('waitForCollectionDeletion', function(name) {
    const base = selector('collections-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExistInCompass(row, true);
  });

  /**
   * Waits for the create collection modal to open.
   */
  client.addCommand('waitForCreateCollectionModal', function() {
    return this.waitForVisibleInCompass(selector('create-collection-modal'));
  });

  /**
   * Waits for the drop collection modal to open.
   */
  client.addCommand('waitForDropCollectionModal', function() {
    return this.waitForVisibleInCompass(selector('drop-collection-modal'));
  });

  client.addCommand('waitForCreateCollectionModalHidden', function() {
    return this.waitForVisibleInCompass(selector('create-collection-modal'), true);
  });
}


function addClickCollectionDDLCommands(client) {
  /**
   * Click the create collection button.
   */
  client.addCommand('clickCreateCollectionButton', function() {
    return this.waitForStatusBar().click(selector('open-create-collection-modal-button'));
  });

  /**
   * Click the LAST delete collection trash icon in the list.
   *
   * @param {String} name - The name of the collection to delete.
   */
  client.addCommand('clickDeleteCollectionButton', function(name) {
    const base = selector('collections-table');
    const wrapper = selector('sortable-table-delete');
    const button = `${base} ${wrapper}[title='Delete ${name}']`;
    return this.waitForVisibleInCompass(base).click(button);
  });

  /**
   * Click the create collection button in the modal.
   */
  client.addCommand('clickCreateCollectionModalButton', function() {
    const base = selector('create-collection-button');
    return this.click(base);
  });

  /**
   * Click the drop collection button in the modal.
   */
  client.addCommand('clickDropCollectionModalButton', function() {
    const base = selector('drop-collection-button');
    return this.click(base);
  });
}


function addInputCollectionDDLCommands(client) {
  /**
   * Input the collection details for creating a collection.
   *
   * @param {Object} model - { name: 'collName' }
   */
  client.addCommand('inputCreateCollectionDetails', function(model) {
    return this.setValue('#create-collection-name', model.name);
  });

  /**
   * Enter the collection name to drop.
   *
   * @param {String} name - The collection name.
   */
  client.addCommand('inputDropCollectionName', function(name) {
    return this.setValue(selector('confirm-drop-collection-name'), name);
  });
}


/**
 * Add commands to the client related to the Collection DDL.
 *
 * @param {Client} client - The client.
 */
function addCollectionDDLCommands(client) {
  addWaitCollectionDDLCommands(client);
  addClickCollectionDDLCommands(client);
  addInputCollectionDDLCommands(client);
}


module.exports = addCollectionDDLCommands;
