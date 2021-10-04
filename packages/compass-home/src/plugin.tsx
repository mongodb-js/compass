import React from 'react';
import AppRegistry from 'hadron-app-registry';
import Home from './components/home';

import './index.less';

function Plugin({
  appRegistry,
}: {
  appRegistry: AppRegistry;
}): React.ReactElement {
  return <Home appRegistry={appRegistry} />;
}

Plugin.displayName = 'HomePlugin';

export default Plugin;
