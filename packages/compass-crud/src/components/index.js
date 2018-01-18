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
         closeInsertDocumentDialog={Actions.closeInsertDocumentDialog}
         insertDocument={Actions.insertDocument}
         elementValid={Actions.elementValid}
         elementInvalid={Actions.elementInvalid}
         openInsertDocumentDialog={Actions.openInsertDocumentDialog} />
    );
  }
}

ConnectedDocumentList.displayName = 'ConnectedDocumentList';

module.exports = ConnectedDocumentList;
