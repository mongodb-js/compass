const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const DocumentList = require('./document-list');
const Store = require('../stores/crud-store');
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
        <DocumentList actions={Actions} {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedDocumentList.displayName = 'ConnectedDocumentList';

module.exports = ConnectedDocumentList;
