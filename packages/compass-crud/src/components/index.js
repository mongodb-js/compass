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
        <DocumentList {...Actions} {...this.props} pageLoadedListenable={Store} isExportable />
      </StoreConnector>
    );
  }
}

ConnectedDocumentList.displayName = 'ConnectedDocumentList';

module.exports = ConnectedDocumentList;
