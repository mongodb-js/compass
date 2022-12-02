import React, { useState, useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import CompassShellStore from './stores';
import { getUserDataFilePath } from './modules/get-user-data-file-path';
import { HistoryStorage } from './modules/history-storage';

function createPlugin() {
  const store = new CompassShellStore();

  function CompassShellPlugin() {
    const [ShellComponent, setShellComponent] = useState(null);
    const historyStorage = useRef(null);

    if (!historyStorage.current) {
      const historyFilePath = getUserDataFilePath('shell-history.json');
      if (historyFilePath) {
        historyStorage.current = new HistoryStorage(historyFilePath);
      }
    }

    useEffect(() => {
      let mounted = true;

      import(/* webpackPreload: true */ './components/compass-shell').then(
        ({ default: Component }) => {
          if (mounted) {
            setShellComponent(Component);
          }
        }
      );

      return () => {
        mounted = false;
      };
    }, []);

    if (ShellComponent) {
      return (
        <Provider store={store.reduxStore}>
          <ShellComponent historyStorage={historyStorage.current} />
        </Provider>
      );
    }

    return null;
  }

  return { store, Plugin: CompassShellPlugin };
}

export default createPlugin;
