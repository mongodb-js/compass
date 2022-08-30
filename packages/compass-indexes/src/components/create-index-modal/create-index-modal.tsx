import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  Modal,
  Disclaimer,
  css,
  spacing,
  H3,
  ModalFooter,
  Body,
  uiColors,
} from '@mongodb-js/compass-components';

import { toggleInProgress } from '../../modules/in-progress';
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
import { toggleIsVisible } from '../../modules/is-visible';
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
import { createIndex } from '../../modules/create-index';
import { resetForm } from '../../modules/reset-form';
import CreateIndexForm from '../create-index-form';
import CreateIndexActions from '../create-index-actions';
import { toggleUseIndexName } from '../../modules/create-index/use-index-name';
import type { RootState } from '../../modules/create-index';
import { toggleIsSparse } from '../../modules/create-index/is-sparse';

const { track } = createLoggerAndTelemetry('COMPASS-IMPORT-EXPORT-UI');

const modalStyles = css({
  'div[role=dialog] > :first-child': {
    minHeight: '50vh',
    maxHeight: '80vh',
    overflow: 'scroll',
  },
});

const modalContentWrapperStyles = css({
  padding: 'initial',
});

const modalContentStyles = css({
  padding: spacing[5],
});

const modalFooterStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

const collectionHeaderTitleLightStyles = css({
  color: uiColors.gray.dark1,
});

const createIndexHeaderTitleDarkStyles = css({
  color: uiColors.gray.light1,
});

/**
 * Create index modal.
 */
function CreateIndexModal({
  toggleIsVisible,
  resetForm,
  isVisible,
  namespace,
  error,
  clearError,
  inProgress,
  createIndex,
  ...props
}: React.ComponentProps<typeof CreateIndexForm> & {
  toggleIsVisible: (isVisible: boolean) => void;
  resetForm: () => void;
  isVisible: boolean;
  namespace: string;
  error: string | null;
  clearError: () => void;
  inProgress: boolean;
  createIndex: () => void;
}) {
  const onSetOpen = useCallback(
    (open) => {
      if (!open) {
        toggleIsVisible(false);
        resetForm();
      } else {
        track('Screen', { name: 'create_index_modal' });
      }
    },
    [toggleIsVisible, resetForm]
  );

  return (
    <Modal
      setOpen={onSetOpen}
      open={isVisible}
      trackingId="create_index_modal"
      data-testid="create-index-modal"
      className={modalStyles}
      contentClassName={modalContentWrapperStyles}
    >
      <Body className={modalContentStyles}>
        <H3
          className={
            props.darkMode
              ? createIndexHeaderTitleDarkStyles
              : collectionHeaderTitleLightStyles
          }
        >
          Create Index
        </H3>
        <Disclaimer>{namespace}</Disclaimer>
        <CreateIndexForm {...props} />
      </Body>
      <ModalFooter className={modalFooterStyles}>
        <CreateIndexActions
          toggleIsVisible={toggleIsVisible}
          resetForm={resetForm}
          error={error}
          clearError={clearError}
          inProgress={inProgress}
          createIndex={createIndex}
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
  toggleInProgress,
  changeSchemaFields,
  clearError,
  handleError,
  toggleIsVisible,
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
  resetForm,
  addField,
  removeField,
  updateFieldName,
  updateFieldType,
  toggleIsSparse,
};
export default connect(mapState, mapDispatch)(CreateIndexModal);
