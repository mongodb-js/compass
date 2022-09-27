import React from 'react';
import type AppRegistry from 'hadron-app-registry';
import { LeafyGreenProvider } from '@mongodb-js/compass-components';
import Settings from '@mongodb-js/compass-settings';

import Home from './components/home';
import AppRegistryContext from './contexts/app-registry-context';

import './index.less';

function Plugin({
  appRegistry,
  ...homeProps
}: {
  appRegistry: AppRegistry;
} & React.ComponentProps<typeof Home>): React.ReactElement {
  return (
    <AppRegistryContext.Provider value={appRegistry}>
      <LeafyGreenProvider>
        <Settings />
        <Home {...homeProps} />
      </LeafyGreenProvider>
    </AppRegistryContext.Provider>
  );
}

Plugin.displayName = 'HomePlugin';

export default Plugin;
