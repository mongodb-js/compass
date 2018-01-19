const React = require('react');
const DocumentList = require('./document-list');
const Actions = require('../actions');

class ConnectedDocumentList extends React.Component {

  /**
   * Connected DocumentList Component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <DocumentList
         pathChanged={Actions.pathChanged}
         documentRemoved={Actions.documentRemoved}
         refreshDocuments={Actions.refreshDocuments}
         getNextPage={Actions.getNextPage}
         getPrevPage={Actions.getPrevPage}
         insertDocument={Actions.insertDocument}
         elementValid={Actions.elementValid}
         elementInvalid={Actions.elementInvalid}
         elementAdded={Actions.elementAdded}
         elementRemoved={Actions.elementRemoved}
         addColumn={Actions.addColumn}
         removeColumn={Actions.removeColumn}
         renameColumn={Actions.renameColumn}
         elementTypeChanged={Actions.elementTypeChanged}
         elementMarkRemoved={Actions.elementMarkRemoved}
         drillDown={Actions.drillDown}
         cleanCols={Actions.cleanCols}
         resetHeaders={Actions.resetHeaders}
         replaceDoc={Actions.replaceDoc}
         closeAllMenus={Actions.closeAllMenus}
         closeInsertDocumentDialog={Actions.closeInsertDocumentDialog}
         openInsertDocumentDialog={Actions.openInsertDocumentDialog} />
    );
  }
}

ConnectedDocumentList.displayName = 'ConnectedDocumentList';

module.exports = ConnectedDocumentList;
