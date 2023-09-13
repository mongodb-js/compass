import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  FormFieldContainer,
  FormModal,
  TextInput,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import {
  closeDropSearchIndexModal,
  dropSearchIndex,
} from '../../modules/search-indexes';

function DropSearchIndexModal({
  isBusy,
  isModalOpen,
  indexName,
  error,
  onDropIndex,
  onHideModal,
}: {
  isBusy: boolean;
  isModalOpen: boolean;
  indexName?: string;
  error?: string;
  onHideModal: () => void;
  onDropIndex: () => void;
}) {
  const [nameConfirmation, setNameConfirmation] = useState('');

  // Since the modal remains mounted, the value of nameConfirmation
  // on reopen of modal will be the last value. So, clean it up
  // when the modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setNameConfirmation('');
    }
  }, [isModalOpen, setNameConfirmation]);

  const onSubmit = useCallback(() => {
    if (indexName === nameConfirmation) {
      onDropIndex();
    }
  }, [indexName, nameConfirmation, onDropIndex]);

  return (
    <FormModal
      title={`Are you sure you want to drop "${indexName}" from Cluster?`}
      subtitle={
        'If you drop default, all queries using it will no longer function'
      }
      open={isModalOpen}
      onSubmit={onSubmit}
      onCancel={onHideModal}
      submitButtonText="Drop Index"
      variant="danger"
      submitDisabled={nameConfirmation !== indexName || isBusy}
      data-testid="drop-search-index-modal"
    >
      <FormFieldContainer>
        <TextInput
          data-testid="confirm-drop-search-index-name"
          label={`Type "${indexName}" to confirm your action`}
          value={nameConfirmation}
          onChange={(e) => setNameConfirmation(e.target.value)}
        />
      </FormFieldContainer>
      {error && <Banner variant="danger">{error}</Banner>}
    </FormModal>
  );
}

const mapStateToProps = ({
  searchIndexes: {
    error,
    dropIndex: { isBusy, isModalOpen, indexName },
  },
}: RootState) => ({
  error,
  isBusy,
  isModalOpen,
  indexName,
});

export default connect(mapStateToProps, {
  onHideModal: closeDropSearchIndexModal,
  onDropIndex: dropSearchIndex,
})(DropSearchIndexModal);
