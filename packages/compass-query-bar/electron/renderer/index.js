// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'mongodb-compass/src/app/styles/index.less';

import React, { useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import QueryBarPlugin, { configureStore, configureActions } from '../../src';

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

// Create a HMR enabled render function
const render = () => {
  ReactDOM.render(
    <AppContainer>
      <QueryBarExampleApp />
    </AppContainer>,
    document.getElementById('root')
  );
};

function useQueryBarPlugin(initialStoreConfig) {
  const { serverVersion, namespace, fields } = initialStoreConfig;

  const appRegistry = useRef(null);

  if (!appRegistry.current) {
    appRegistry.current = new AppRegistry();
  }

  const actions = useRef(null);

  if (!actions.current) {
    actions.current = configureActions();
  }

  const store = useRef(null);

  if (!store.current) {
    store.current = configureStore({
      localAppRegistry: appRegistry.current,
      actions: actions.current,
      serverVersion,
      namespace,
      fields,
    });
  }

  // Wrapping plugin component to override onApply with our version that
  // provides the state in the callback
  const QueryBar = useCallback(({ onApply, onReset, ...props }) => {
    const onApplyWithState = useCallback(() => {
      onApply({ ...store.current.state });
    }, [onApply]);

    const onResetWithState = useCallback(() => {
      onReset({ ...store.current.state });
    }, [onReset]);

    return (
      <QueryBarPlugin
        {...props}
        onApply={onApplyWithState}
        onReset={onResetWithState}
        store={store.current}
        actions={actions.current}
      />
    );
  }, []);

  return {
    QueryBar,
    store: store.current,
    actions: actions.current,
    appRegistry: appRegistry.current,
  };
}

function QueryBarExampleApp() {
  const { QueryBar, store } = useQueryBarPlugin({
    serverVersion: '4.2.0',
    namespace: 'echo.artists',
    fields: [
      {
        name: 'harry',
        value: 'harry',
        score: 1,
        meta: 'field',
        version: '0.0.0',
      },
      {
        name: 'potter',
        value: 'potter',
        score: 1,
        meta: 'field',
        version: '0.0.0',
      },
    ],
  });

  const [queryBarState, setQueryBarState] = useState(store.state);

  return (
    <>
      <QueryBar
        onApply={(state) => setQueryBarState(state)}
        onReset={(state) => setQueryBarState(state)}
      />
      <pre style={{ margin: 12 }}>{JSON.stringify(queryBarState, null, 2)}</pre>
    </>
  );
}

// Render our plugin
render(QueryBarExampleApp);

if (module.hot) {
  /**
   * Warning from React Router, caused by react-hot-loader.
   * The warning can be safely ignored, so filter it from the console.
   * Otherwise you'll see it every time something changes.
   * See https://github.com/gaearon/react-hot-loader/issues/298
   */
  // eslint-disable-next-line no-console
  const orgError = console.error;
  // eslint-disable-next-line no-console
  console.error = (message) => {
    if (
      message &&
      message.indexOf('You cannot change <Router routes>;') === -1
    ) {
      // Log the error as normally
      orgError.apply(console, [message]);
    }
  };

  module.hot.accept('plugin', () => {
    render(QueryBarExampleApp);
  });
}
