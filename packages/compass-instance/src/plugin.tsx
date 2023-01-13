import React from 'react';
import { Provider, connect } from 'react-redux';
import type { Dispatch } from 'redux';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';

import store from './stores';
import type { RootState } from './stores';
import { InstanceComponent } from './components/instance';

const ConnectedInstanceComponent = connect((state: RootState) => state, {
  onTabClick(tabId: number) {
    return (dispatch: Dispatch, getState: () => RootState) => {
      const state = getState();
      // By emitting open-instance-workspace rather than change-tab directly,
      // the clicks on the tabs work the same way compared to when we select a
      // tab from the outside. That way things like the sidebar can be aware
      // that the instance tab is changing.
      dispatch(
        globalAppRegistryEmit('open-instance-workspace', state.tabs[tabId].name)
      );
    };
  },
})(InstanceComponent);

function InstancePlugin() {
  return (
    <Provider store={store}>
      <ConnectedInstanceComponent />
    </Provider>
  );
}

export default InstancePlugin;
