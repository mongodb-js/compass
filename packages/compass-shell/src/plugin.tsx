import React, { useState, useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import CompassShellStore from './stores';
import { HistoryStorage } from './modules/history-storage';
import type CompassShellComponentType from './components/compass-shell';

function createPlugin() {
  const store = new CompassShellStore();

  function CompassShellPlugin() {
    const [ShellComponent, setShellComponent] = useState<
      typeof CompassShellComponentType | null
    >(null);
    const historyStorage = useRef<HistoryStorage | null>(null);

    if (!historyStorage.current) {
      historyStorage.current = new HistoryStorage();
    }

    useEffect(() => {
      let mounted = true;

      void import(/* webpackPreload: true */ './components/compass-shell').then(
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
