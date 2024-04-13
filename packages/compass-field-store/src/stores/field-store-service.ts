import { type Schema } from 'mongodb-schema';
import { createServiceLocator } from 'hadron-app-registry';
import {
  connectionInfoAccessLocator,
  type ConnectionInfoAccess,
} from '@mongodb-js/compass-connections/provider';
import { useDispatch } from './context';
import { documentsUpdated, schemaUpdated } from '../modules';

export type FieldStoreService = {
  updateFieldsFromDocuments(
    ns: string,
    documents: Record<string, any>[]
  ): Promise<void>;
  updateFieldsFromSchema(ns: string, schema: Schema): void;
};

export function createFieldStoreService(
  dispatch: ReturnType<typeof useDispatch>,
  connectionInfoAccess: ConnectionInfoAccess
): FieldStoreService {
  return {
    async updateFieldsFromDocuments(
      ns: string,
      documents: Record<string, any>[]
    ) {
      try {
        dispatch(
          await documentsUpdated(
            connectionInfoAccess.getCurrentConnectionInfo().id,
            ns,
            documents
          )
        );
      } catch (error) {
        // ignore errors
      }
    },
    updateFieldsFromSchema(ns: string, schema: Schema) {
      dispatch(
        schemaUpdated(
          connectionInfoAccess.getCurrentConnectionInfo().id,
          ns,
          schema
        )
      );
    },
  };
}

export const fieldStoreServiceLocator = createServiceLocator(
  function fieldStoreServiceLocator() {
    const dispatch = useDispatch();
    const connectionInfoAccess = connectionInfoAccessLocator();
    return createFieldStoreService(dispatch, connectionInfoAccess);
  },
  'fieldStoreServiceLocator'
);
