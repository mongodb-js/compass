import type { Reducer } from 'redux';
import { uniq, omit } from 'lodash';
import parseSchema, { type Schema } from 'mongodb-schema';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import type { SchemaFieldSubset } from './fields';
import { mergeSchema } from './fields';

export const CONNECTION_DISCONNECTED = 'field-store/CONNECTION_DISCONNECTED';
export const DOCUMENTS_UPDATED = 'field-store/DOCUMENTS_UPDATED';
export const SCHEMA_UPDATED = 'field-store/SCHEMA_UPDATED';

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
  if (action.type === DOCUMENTS_UPDATED || action.type === SCHEMA_UPDATED) {
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
  } else if (action.type === CONNECTION_DISCONNECTED) {
    return omit(state, action.connectionInfoId);
  }
  return state;
};

export const documentsUpdated = async (
  connectionInfoId: ConnectionInfo['id'],
  namespace: string,
  documents: Array<Record<string, any>>
) => {
  const { fields } = await parseSchema(documents);
  return {
    type: DOCUMENTS_UPDATED,
    connectionInfoId,
    namespace,
    schemaFields: fields,
  };
};

export const schemaUpdated = (
  connectionInfoId: ConnectionInfo['id'],
  namespace: string,
  schema: Schema
) => ({
  type: SCHEMA_UPDATED,
  connectionInfoId,
  namespace,
  schemaFields: schema.fields,
});

export const connectionDisconnected = (
  connectionInfoId: ConnectionInfo['id']
) => ({
  type: CONNECTION_DISCONNECTED,
  connectionInfoId,
});

export default reducer;
