import type { Reducer } from 'redux';
import { uniq } from 'lodash';
import type { SchemaField } from 'mongodb-schema';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { SchemaFieldSubset } from './fields';
import { mergeSchema } from './fields';

export const CHANGE_FIELDS = 'field-store/CHANGE_FIELDS';

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
      currentNamespaceFields.fields ?? {},
      action.schemaFields
    );

    const nextState = {
      ...state,
      [action.connectionInfoId]: {
        ...state[action.connectionInfoId],
        [action.namespace]: {
          fields,
          topLevelFields: uniq(
            (currentNamespaceFields.topLevelFields ?? []).concat(topLevelFields)
          ),
        },
      },
    };
    // console.log('?????????',  { state, action: JSON.stringify(action, null, 2), nextState: JSON.stringify(nextState, null, 2) });
    return nextState;
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

export default reducer;
