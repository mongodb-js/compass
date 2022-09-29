import React from 'react';
import type AppRegistry from 'hadron-app-registry';
import { LeafyGreenProvider } from '@mongodb-js/compass-components';

import Home from './components/home';
import AppRegistryContext from './contexts/app-registry-context';

import './index.less';

function Plugin({
  appName,
  appRegistry,
  showWelcomeModal,
}: {
  appName: string;
  appRegistry: AppRegistry;
  showWelcomeModal: boolean; // TODO: how do we get it here?
}): React.ReactElement {
  return (
    <AppRegistryContext.Provider value={appRegistry}>
      <LeafyGreenProvider>
        <Home appName={appName} showWelcomeModal={showWelcomeModal} />
      </LeafyGreenProvider>
    </AppRegistryContext.Provider>
  );
}

Plugin.displayName = 'HomePlugin';

export default Plugin;
