import type { Action, Reducer } from 'redux';
import { uniq, omit } from 'lodash';
import type { SchemaField, Schema } from 'mongodb-schema';
import { parseSchema } from 'mongodb-schema';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import type { SchemaFieldSubset } from './fields';
import { mergeSchema } from './fields';
import type { ThunkAction } from 'redux-thunk';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { isAction } from '@mongodb-js/compass-utils';

export const CONNECTION_DISCONNECTED =
  'field-store/CONNECTION_DISCONNECTED' as const;
export const DOCUMENTS_UPDATED = 'field-store/DOCUMENTS_UPDATED' as const;
export const SCHEMA_UPDATED = 'field-store/SCHEMA_UPDATED' as const;

type Namespace = string;

export type NamespacesFieldsState = Record<
  Namespace,
  { fields: Record<string, SchemaFieldSubset>; topLevelFields: string[] }
>;

export type ConnectionNamespacesState = Record<
  ConnectionInfo['id'],
  NamespacesFieldsState
>;

const reducer: Reducer<ConnectionNamespacesState, Action> = (
  state = {},
  action
) => {
  if (
    isAction<DocumentsUpdatedAction>(action, DOCUMENTS_UPDATED) ||
    isAction<SchemaUpdatedAction>(action, SCHEMA_UPDATED)
  ) {
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
  } else if (
    isAction<ConnectionDisconnectedAction>(action, CONNECTION_DISCONNECTED)
  ) {
    return omit(state, action.connectionInfoId);
  }
  return state;
};

interface DocumentsUpdatedAction {
  type: typeof DOCUMENTS_UPDATED;
  connectionInfoId: ConnectionInfo['id'];
  namespace: Namespace;
  schemaFields: SchemaField[];
}

export const documentsUpdated = (
  connectionInfoId: ConnectionInfo['id'],
  namespace: string,
  documents: Array<Record<string, any>>
): ThunkAction<
  Promise<void>,
  ConnectionNamespacesState,
  { logger: Logger },
  DocumentsUpdatedAction
> => {
  return async (dispatch, _getState, { logger: { mongoLogId, log } }) => {
    try {
      const { fields } = await parseSchema(documents);
      dispatch({
        type: DOCUMENTS_UPDATED,
        connectionInfoId,
        namespace,
        schemaFields: fields,
      });
    } catch (err) {
      log.warn(
        mongoLogId(1_001_000_328),
        'Field Store',
        'Failed to generate schema for documents',
        { error: (err as Error).message }
      );
    }
  };
};

interface SchemaUpdatedAction {
  type: typeof SCHEMA_UPDATED;
  connectionInfoId: ConnectionInfo['id'];
  namespace: Namespace;
  schemaFields: SchemaField[];
}

export const schemaUpdated = (
  connectionInfoId: ConnectionInfo['id'],
  namespace: string,
  schema: Schema
): SchemaUpdatedAction => ({
  type: SCHEMA_UPDATED,
  connectionInfoId,
  namespace,
  schemaFields: schema.fields,
});

interface ConnectionDisconnectedAction {
  type: typeof CONNECTION_DISCONNECTED;
  connectionInfoId: ConnectionInfo['id'];
}

export const connectionDisconnected = (
  connectionInfoId: ConnectionInfo['id']
): ConnectionDisconnectedAction => ({
  type: CONNECTION_DISCONNECTED,
  connectionInfoId,
});

export default reducer;
