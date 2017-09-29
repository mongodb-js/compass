import React, { Component } from 'react';
import { StoreConnector } from 'hadron-react-components';
import { QueryBarStore } from 'stores';
import QueryBarActions from 'actions';
import QueryBar from 'components/query-bar';

class Plugin extends Component {
  static displayName = 'QueryBarPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={QueryBarStore}>
        <QueryBar actions={QueryBarActions} {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
export { Plugin };
