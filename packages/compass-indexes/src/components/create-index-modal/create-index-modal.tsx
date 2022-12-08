import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
} from '@mongodb-js/compass-components';

import {
  addField,
  removeField,
  updateFieldType,
  updateFieldName,
} from '../../modules/create-index/fields';
import { nameChanged } from '../../modules/create-index/name';
import { changeSchemaFields } from '../../modules/create-index/schema-fields';
import {
  createNewIndexField,
  clearNewIndexField,
} from '../../modules/create-index/new-index-field';
import { clearError, handleError } from '../../modules/error';
import { toggleIsUnique } from '../../modules/create-index/is-unique';
import { toggleUsePartialFilterExpression } from '../../modules/create-index/use-partial-filter-expression';
import { toggleUseTtl } from '../../modules/create-index/use-ttl';
import { ttlChanged } from '../../modules/create-index/ttl';
import { toggleUseWildcardProjection } from '../../modules/create-index/use-wildcard-projection';
import { toggleUseColumnstoreProjection } from '../../modules/create-index/use-columnstore-projection';
import { wildcardProjectionChanged } from '../../modules/create-index/wildcard-projection';
import { columnstoreProjectionChanged } from '../../modules/create-index/columnstore-projection';
import { partialFilterExpressionChanged } from '../../modules/create-index/partial-filter-expression';
import { toggleUseCustomCollation } from '../../modules/create-index/use-custom-collation';
import { collationStringChanged } from '../../modules/create-index/collation-string';
import { openLink } from '../../modules/link';
import { createIndex, closeCreateIndexModal } from '../../modules/create-index';
import { CreateIndexForm } from '../create-index-form/create-index-form';
import CreateIndexActions from '../create-index-actions';
import { toggleUseIndexName } from '../../modules/create-index/use-index-name';
import type { RootState } from '../../modules/create-index';
import { toggleIsSparse } from '../../modules/create-index/is-sparse';

const { track } = createLoggerAndTelemetry('COMPASS-IMPORT-EXPORT-UI');

function CreateIndexModal({
  isVisible,
  namespace,
  error,
  clearError,
  inProgress,
  createIndex,
  closeCreateIndexModal,
  ...props
}: React.ComponentProps<typeof CreateIndexForm> & {
  isVisible: boolean;
  namespace: string;
  error: string | null;
  clearError: () => void;
  inProgress: boolean;
  createIndex: () => void;
  closeCreateIndexModal: () => void;
}) {
  const onSetOpen = useCallback(
    (open) => {
      if (!open) {
        closeCreateIndexModal();
      } else {
        track('Screen', { name: 'create_index_modal' });
      }
    },
    [closeCreateIndexModal]
  );

  return (
    <Modal
      setOpen={onSetOpen}
      open={isVisible}
      trackingId="create_index_modal"
      data-testid="create-index-modal"
    >
      <ModalHeader title="Create Index" subtitle={namespace} />

      <ModalBody>
        <CreateIndexForm {...props} />
      </ModalBody>

      <ModalFooter>
        <CreateIndexActions
          error={error}
          clearError={clearError}
          inProgress={inProgress}
          createIndex={createIndex}
          closeCreateIndexModal={closeCreateIndexModal}
        />
      </ModalFooter>
    </Modal>
  );
}

const mapState = ({
  fields,
  inProgress,
  schemaFields,
  error,
  isVisible,
  useTtl,
  ttl,
  useColumnstoreProjection,
  columnstoreProjection,
  wildcardProjection,
  useWildcardProjection,
  isUnique,
  usePartialFilterExpression,
  partialFilterExpression,
  useCustomCollation,
  useIndexName,
  collationString,
  name,
  namespace,
  serverVersion,
  newIndexField,
  isSparse,
}: RootState) => ({
  fields,
  inProgress,
  schemaFields,
  error,
  isVisible,
  useTtl,
  ttl,
  useColumnstoreProjection,
  columnstoreProjection,
  wildcardProjection,
  useWildcardProjection,
  isUnique,
  usePartialFilterExpression,
  partialFilterExpression,
  useCustomCollation,
  useIndexName,
  collationString,
  name,
  namespace,
  serverVersion,
  newIndexField,
  isSparse,
});

const mapDispatch = {
  changeSchemaFields,
  clearError,
  handleError,
  toggleUseTtl,
  toggleUseWildcardProjection,
  toggleUseColumnstoreProjection,
  toggleIsUnique,
  toggleUsePartialFilterExpression,
  toggleUseCustomCollation,
  toggleUseIndexName,
  partialFilterExpressionChanged,
  ttlChanged,
  wildcardProjectionChanged,
  columnstoreProjectionChanged,
  collationStringChanged,
  createNewIndexField,
  clearNewIndexField,
  openLink,
  nameChanged,
  createIndex,
  closeCreateIndexModal,
  addField,
  removeField,
  updateFieldName,
  updateFieldType,
  toggleIsSparse,
};
export default connect(mapState, mapDispatch)(CreateIndexModal);
