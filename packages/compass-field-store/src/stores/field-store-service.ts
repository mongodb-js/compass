import { type Schema } from 'mongodb-schema';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import {
  useConnectionInfoRef,
  type ConnectionInfoRef,
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
  connectionInfoRef: ConnectionInfoRef
): FieldStoreService {
  return {
    async updateFieldsFromDocuments(
      ns: string,
      documents: Record<string, any>[]
    ) {
      await dispatch(
        documentsUpdated(connectionInfoRef.current.id, ns, documents)
      );
    },
    updateFieldsFromSchema(ns: string, schema: Schema) {
      dispatch(schemaUpdated(connectionInfoRef.current.id, ns, schema));
    },
  };
}

/**
 * @internal exported for test purposes only
 */
export function useFieldStoreService(): FieldStoreService {
  const dispatch = useDispatch();
  const connectionInfoRef = useConnectionInfoRef();
  return createFieldStoreService(dispatch, connectionInfoRef);
}

export const fieldStoreServiceLocator: () => FieldStoreService =
  createServiceLocator(useFieldStoreService, 'fieldStoreServiceLocator');
