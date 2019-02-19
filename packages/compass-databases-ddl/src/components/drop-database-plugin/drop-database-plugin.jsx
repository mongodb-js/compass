import React, { Component } from 'react';
import { Provider } from 'react-redux';
import DropDatabaseModal from 'components/drop-database-modal';
import store from 'stores/drop-database';

class DropDatabasePlugin extends Component {
  static displayName = 'DropDatabasePlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <DropDatabaseModal />
      </Provider>
    );
  }
}

export default DropDatabasePlugin;
