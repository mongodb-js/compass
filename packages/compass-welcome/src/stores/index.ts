import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';

type WelcomeServices = {
  globalAppRegistry: AppRegistry;
  logger: LoggerAndTelemetry;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
};

export function configureStore({
  globalAppRegistry,
  logger,
  workspaces,
}: WelcomeServices) {
  return createStore(
    combineReducers({}),
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        logger,
        workspaces,
      })
    )
  );
}

export type RootState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

export function activatePlugin(_: unknown, services: WelcomeServices) {
  const store = configureStore(services);
  console.log('welcome activatePlugin', { store });
  return {
    store,
    deactivate() {
      // noop, no subscriptions in this plugin
    },
  };
}
