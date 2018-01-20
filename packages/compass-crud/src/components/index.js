const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const Store = require('../stores/crud-store');
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
      <StoreConnector store={Store}>
        <DocumentList
           pathChanged={Actions.pathChanged}
           documentRemoved={Actions.documentRemoved}
           refreshDocuments={Actions.refreshDocuments}
           getNextPage={Actions.getNextPage}
           getPrevPage={Actions.getPrevPage}
           insertDocument={Actions.insertDocument}
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
           viewChanged={Actions.viewChanged}
           closeInsertDocumentDialog={Actions.closeInsertDocumentDialog}
           openInsertDocumentDialog={Actions.openInsertDocumentDialog}
           {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedDocumentList.displayName = 'ConnectedDocumentList';

module.exports = ConnectedDocumentList;
