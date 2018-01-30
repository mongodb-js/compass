import React from 'react';
import { StoreConnector } from 'hadron-react-components';
import Store from 'stores/crud-store';
import DocumentList from 'components/document-list';
import Actions from 'actions';

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
          {...Actions}
          {...this.props}
          pageLoadedListenable={Store}
          isExportable />
      </StoreConnector>
    );
  }
}

ConnectedDocumentList.displayName = 'ConnectedDocumentList';

export default ConnectedDocumentList;
