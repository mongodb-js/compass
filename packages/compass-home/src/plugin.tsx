import React from 'react';
import type AppRegistry from 'hadron-app-registry';
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
      <Home {...homeProps} />
    </AppRegistryContext.Provider>
  );
}

Plugin.displayName = 'HomePlugin';

export default Plugin;
