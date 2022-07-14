import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StoreConnector } from 'hadron-react-components';
import DocumentList from './document-list';

class ConnectedDocumentList extends Component {
  static displayName = 'ConnectedDocumentList';
  static propTypes = {
    store: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
  };

  /**
   * Connected DocumentList Component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={this.props.store}>
        <DocumentList
          {...this.props.actions}
          {...this.props}
          pageLoadedListenable={this.props.store}
          isExportable
        />
      </StoreConnector>
    );
  }
}

export default ConnectedDocumentList;
