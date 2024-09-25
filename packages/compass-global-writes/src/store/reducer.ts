import type { Action, Reducer } from 'redux';
import type { GlobalWritesThunkAction } from '.';

export function isAction<A extends Action>(
  action: Action,
  type: A['type']
): action is A {
  return action.type === type;
}

enum GlobalWritesActionTypes {
  SetIsManagedNamespace = 'global-writes/SetIsManagedNamespace',
}

type SetIsManagedNamespaceAction = {
  type: GlobalWritesActionTypes.SetIsManagedNamespace;
  isNamespaceManaged: boolean;
};

export enum ShardingStatuses {
  /**
   * Initial status, no information available yet.
   */
  NOT_READY = 'NOT_READY',

  /**
   * Namespace is not geo-sharded.
   */
  UNSHARDED = 'UNSHARDED',
}

export type RootState = {
  namespace: string;
  isNamespaceSharded: boolean;
  status: keyof typeof ShardingStatuses;
};

const initialState: RootState = {
  namespace: '',
  isNamespaceSharded: false,
  status: ShardingStatuses.NOT_READY,
};

const reducer: Reducer<RootState, Action> = (state = initialState) => {
  return state;
};

export const updateIsNamespaceManaged =
  (): GlobalWritesThunkAction<Promise<void>, SetIsManagedNamespaceAction> =>
  async (
    dispatch,
    getState,
    { atlasGlobalWritesService, connectionInfoRef }
  ) => {
    if (!connectionInfoRef.current.atlasMetadata) {
      return;
    }

    const { clusterName, orgId } = connectionInfoRef.current.atlasMetadata;
    const { namespace } = getState();

    const isNamespaceManaged =
      await atlasGlobalWritesService.isNamespaceManaged(namespace, {
        orgId,
        clusterName,
      });

    dispatch({
      type: GlobalWritesActionTypes.SetIsManagedNamespace,
      isNamespaceManaged,
    });
  };

export default reducer;
