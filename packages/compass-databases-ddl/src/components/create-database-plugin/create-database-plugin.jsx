import React, { Component } from 'react';
import { Provider } from 'react-redux';
import CreateDatabaseModal from 'components/create-database-modal';
import store from 'stores/create-database';

class CreateDatabasePlugin extends Component {
  static displayName = 'CreateDatabasePlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <CreateDatabaseModal />
      </Provider>
    );
  }
}

export default CreateDatabasePlugin;
