import { type Schema } from 'mongodb-schema';
import { createServiceLocator } from 'hadron-app-registry';
import {
  useConnectionInfoAccess,
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

function createFieldStoreService(
  dispatch: ReturnType<typeof useDispatch>,
  connectionInfoAccess: ConnectionInfoAccess
): FieldStoreService {
  return {
    async updateFieldsFromDocuments(
      ns: string,
      documents: Record<string, any>[]
    ) {
      await dispatch(
        documentsUpdated(
          connectionInfoAccess.getCurrentConnectionInfo().id,
          ns,
          documents
        )
      );
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

/**
 * @internal exported for test purposes only
 */
export function useFieldStoreService() {
  const dispatch = useDispatch();
  const connectionInfoAccess = useConnectionInfoAccess();
  return createFieldStoreService(dispatch, connectionInfoAccess);
}

export const fieldStoreServiceLocator = createServiceLocator(
  useFieldStoreService,
  'fieldStoreServiceLocator'
);
