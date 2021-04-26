import React, { Component } from 'react';
import { Provider } from 'react-redux';
import CompassShell from 'components/compass-shell';
import CompassShellStore from 'stores';
import { getUserDataFilePath } from 'modules/get-user-data-file-path';
import { HistoryStorage } from 'modules/history-storage';

function createPlugin() {
  const store = new CompassShellStore();
  const Plugin = class extends Component {
    static displayName = 'CompassShellPlugin';

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
        <Provider store={store.reduxStore}>
          <CompassShell historyStorage={this.initializeHistoryStorage()} />
        </Provider>
      );
    }
  };

  return {store, Plugin};
}

export default createPlugin;
