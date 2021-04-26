import React, { Component } from 'react';
import { StoreConnector } from 'hadron-react-components';
import ServerVersion from 'components/server-version';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'ServerVersionPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={store}>
        <ServerVersion {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
export { Plugin };
