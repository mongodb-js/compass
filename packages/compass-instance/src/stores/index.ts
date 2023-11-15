import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import type { AnyAction, Reducer, Action } from 'redux';
import type { MongoDBInstance } from 'mongodb-instance-model';

export type State = {
  activeTabName: string | null;
  instanceInfoLoadingStatus: MongoDBInstance['status'];
  instanceInfoLoadingError: string | null;
  isDataLake: boolean;
};

const INITIAL_STATE = {
  activeTabName: null,
  instanceInfoLoadingStatus: 'initial',
  instanceInfoLoadingError: null,
  isDataLake: false,
};

type InstanceWorkspaceThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<
  R,
  State,
  Pick<InstanceWorkspaceServices, 'globalAppRegistry'>,
  A
>;

type InstanceWorkspaceServices = {
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
};

const CHANGE_TAB = 'change-tab';

export const changeTab = (tabName: string) => {
  return { type: CHANGE_TAB, tabName };
};

export const emitChangeTab = (
  tabName: string
): InstanceWorkspaceThunkAction<void> => {
  return (_dispatch, _getState, { globalAppRegistry }) => {
    // By emitting open-instance-workspace rather than change-tab directly,
    // the clicks on the tabs work the same way compared to when we select a
    // tab from the outside. That way things like the sidebar can be aware
    // that the instance tab is changing.
    //
    // TODO(COMPASS-7354): Will go away with workspaces plugin
    globalAppRegistry.emit('open-instance-workspace', tabName);
  };
};

const MONGODB_INSTANCE_INFO_STATUS_CHANGED =
  'mongodb-instance-info-status-changed';

const instanceInfoStatusChanged = (instance: MongoDBInstance) => {
  return {
    type: MONGODB_INSTANCE_INFO_STATUS_CHANGED,
    status: instance.status,
    error: instance.statusError,
    isDataLake: instance.dataLake.isDataLake,
  };
};

const reducer: Reducer<State> = (state = { ...INITIAL_STATE }, action) => {
  if (action.type === CHANGE_TAB) {
    return {
      ...state,
      activeTabName: action.tabName,
    };
  }

  if (action.type === MONGODB_INSTANCE_INFO_STATUS_CHANGED) {
    return {
      ...state,
      instanceInfoLoadingStatus: action.status,
      instanceInfoLoadingError: action.error,
      isDataLake: action.isDataLake,
    };
  }

  return state;
};

export function activatePlugin(
  _: unknown,
  { globalAppRegistry, instance }: InstanceWorkspaceServices
) {
  const store = createStore(
    reducer,
    {
      ...INITIAL_STATE,
      isDataLake: instance.dataLake.isDataLake,
      instanceInfoLoadingStatus: instance.status,
      instanceInfoLoadingError: instance.statusError,
    },
    applyMiddleware(thunk.withExtraArgument({ globalAppRegistry }))
  );

  const onOpenInstanceWorkspace = (tabName: string) => {
    store.dispatch(changeTab(tabName));
  };

  globalAppRegistry.on('open-instance-workspace', onOpenInstanceWorkspace);

  const onInstanceStatusChanged = () => {
    store.dispatch(instanceInfoStatusChanged(instance));
  };

  instance.on('change:status', onInstanceStatusChanged);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'open-instance-workspace',
        onOpenInstanceWorkspace
      );
      instance.removeListener('change:status', onInstanceStatusChanged);
    },
  };
}
