import React, { useCallback } from 'react';
import { closeCreateModal, createIndex } from '../../modules/search-indexes';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { Document } from 'mongodb';
import { BaseSearchIndexModal } from './base-search-index-modal';

export const DEFAULT_INDEX_DEFINITION = `{
  mappings: {
    dynamic: true,
  },
}`;

type CreateSearchIndexModalProps = {
  isModalOpen: boolean;
  isBusy: boolean;
  error: string | undefined;
  onCreateIndex: (indexName: string, indexDefinition: Document) => void;
  onCloseModal: () => void;
};

export const CreateSearchIndexModal: React.FunctionComponent<
  CreateSearchIndexModalProps
> = ({ isModalOpen, isBusy, error, onCreateIndex, onCloseModal }) => {
  const onSubmit = useCallback(
    (indexName: string, indexDefinition: Document) => {
      onCreateIndex(indexName, indexDefinition);
    },
    [onCreateIndex]
  );

  return (
    <BaseSearchIndexModal
      mode={'create'}
      initialIndexName={'default'}
      initialIndexDefinition={DEFAULT_INDEX_DEFINITION}
      isModalOpen={isModalOpen}
      isBusy={isBusy}
      error={error}
      onSubmit={onSubmit}
      onClose={onCloseModal}
    />
  );
};

const mapState = ({
  searchIndexes: {
    createIndex: { isBusy, isModalOpen, error },
  },
}: RootState) => ({
  isModalOpen,
  isBusy,
  error,
});

const mapDispatch = {
  onCloseModal: closeCreateModal,
  onCreateIndex: createIndex,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexModal);
