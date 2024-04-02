import type { Reducer } from 'redux';
import { uniq, omit } from 'lodash';
import type { SchemaField } from 'mongodb-schema';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import type { SchemaFieldSubset } from './fields';
import { mergeSchema } from './fields';

export const CHANGE_FIELDS = 'field-store/CHANGE_FIELDS';
export const REMOVE_CONNECTION_NAMESPACES =
  'field-store/REMOVE_CONNECTION_NAMESPACES';

type Namespace = string;

export type NamespacesFieldsState = Record<
  Namespace,
  { fields: Record<string, SchemaFieldSubset>; topLevelFields: string[] }
>;

export type ConnectionNamespacesState = Record<
  ConnectionInfo['id'],
  NamespacesFieldsState
>;

const reducer: Reducer<ConnectionNamespacesState> = (state = {}, action) => {
  if (action.type === CHANGE_FIELDS) {
    const currentConnectionNamespaces = state[action.connectionInfoId] ?? {};
    const currentNamespaceFields =
      currentConnectionNamespaces[action.namespace] ?? {};
    const { fields, topLevelFields } = mergeSchema(
      currentNamespaceFields['fields'] ?? {},
      action.schemaFields
    );

    return {
      ...state,
      [action.connectionInfoId]: {
        ...state[action.connectionInfoId],
        [action.namespace]: {
          fields,
          topLevelFields: uniq(
            (currentNamespaceFields['topLevelFields'] ?? []).concat(
              topLevelFields
            )
          ),
        },
      },
    };
  } else if (action.type === REMOVE_CONNECTION_NAMESPACES) {
    return omit(state, action.connectionInfoId);
  }
  return state;
};

export const changeFields = (
  connectionInfoId: ConnectionInfo['id'],
  namespace: string,
  schemaFields: SchemaField[]
) => ({
  type: CHANGE_FIELDS,
  connectionInfoId,
  namespace,
  schemaFields,
});

export const removeConnectionNamespaces = (
  connectionInfoId: ConnectionInfo['id']
) => ({
  type: REMOVE_CONNECTION_NAMESPACES,
  connectionInfoId,
});

export default reducer;
