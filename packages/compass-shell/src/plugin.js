import React, { Component } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';

import CompassShell from './components/compass-shell';
import CompassShellStore from './stores';
import { getUserDataFilePath } from './modules/get-user-data-file-path';
import { HistoryStorage } from './modules/history-storage';
import { setupRuntime } from './modules/runtime';

// function createPlugin() {
class Plugin extends Component {
  static displayName = 'CompassShellPlugin';

  static propTypes = {
    dataService: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);

    this.store = new CompassShellStore();
    this.store.reduxStore.dispatch(setupRuntime(
      null,
      props.dataService,
      global.hadronApp.appRegistry
    ));
  }

  initializeHistoryStorage() {
    const historyFilePath = getUserDataFilePath('shell-history.json');

    if (!historyFilePath) {
      return;
    }

    return new HistoryStorage(historyFilePath);
  }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={this.store.reduxStore}>
        <CompassShell
          historyStorage={this.initializeHistoryStorage()}
        />
      </Provider>
    );
  }
}

// return {store, Plugin};
// }

// export {
//   Plugin,
//   // store
// };

export default Plugin;
