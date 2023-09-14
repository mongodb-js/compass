import React from 'react';
import { type AppRegistry, AppRegistryProvider } from 'hadron-app-registry';
import Home from './components/home';

function Plugin({
  localAppRegistry,
  ...homeProps
}: {
  localAppRegistry: AppRegistry;
} & React.ComponentProps<typeof Home>): React.ReactElement {
  return (
    <AppRegistryProvider localAppRegistry={localAppRegistry}>
      <Home {...homeProps} />
    </AppRegistryProvider>
  );
}

Plugin.displayName = 'HomePlugin';

export default Plugin;
