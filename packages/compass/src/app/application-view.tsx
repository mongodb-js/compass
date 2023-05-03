import './index.less';
import 'source-code-pro/source-code-pro.css';

import React from 'react';
import ReactDOM from 'react-dom';

export function render({
  app,
  remote,
  getAutoConnectInfo,
}: {
  app: any;
  remote: any;
  getAutoConnectInfo: any;
}) {
  const HomeComponent = app.appRegistry.getComponent('Home.Home');

  if (HomeComponent) {
    ReactDOM.render(
      <React.StrictMode>
        <HomeComponent
          appRegistry={app.appRegistry}
          appName={remote.app.getName()}
          getAutoConnectInfo={getAutoConnectInfo}
        ></HomeComponent>
      </React.StrictMode>,
      document.getElementById('application')
    );
  }

  document.querySelector('#loading-placeholder')?.remove();
}
