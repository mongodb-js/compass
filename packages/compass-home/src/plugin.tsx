import React from 'react';
import { type AppRegistry, AppRegistryProvider } from 'hadron-app-registry';
import Home from './components/home';

function Plugin({
  appRegistry,
  ...homeProps
}: {
  appRegistry: AppRegistry;
} & React.ComponentProps<typeof Home>): React.ReactElement {
  return (
    <AppRegistryProvider value={appRegistry}>
      <Home {...homeProps} />
    </AppRegistryProvider>
  );
}

Plugin.displayName = 'HomePlugin';

export default Plugin;
