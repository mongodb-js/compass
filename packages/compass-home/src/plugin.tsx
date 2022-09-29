import React from 'react';
import type AppRegistry from 'hadron-app-registry';

import Home from './components/home';
import AppRegistryContext from './contexts/app-registry-context';

import './index.less';

function Plugin({
  appName,
  appRegistry,
}: {
  appName: string;
  appRegistry: AppRegistry;
}): React.ReactElement {
  return (
    <AppRegistryContext.Provider value={appRegistry}>
      <Home appName={appName} />
    </AppRegistryContext.Provider>
  );
}

Plugin.displayName = 'HomePlugin';

export default Plugin;
