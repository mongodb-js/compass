import React, { Component } from 'react';
import { StoreConnector } from 'hadron-react-components';
import Security from 'components/security';
import store from 'stores';
import actions from 'actions';

class Plugin extends Component {
  static displayName = 'SecurityPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={store}>
        <Security actions={actions} {...this.props} />
      </StoreConnector>
    );
  }
}

export default Plugin;
export { Plugin };
