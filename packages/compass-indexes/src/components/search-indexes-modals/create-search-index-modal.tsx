import React from 'react';
import { closeCreateModal, createIndex } from '../../modules/search-indexes';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { Document } from 'mongodb';
import { BaseSearchIndexModal } from './base-search-index-modal';
import type { SearchIndexType } from './base-search-index-modal';

export const DEFAULT_INDEX_DEFINITION = `{
  mappings: {
    dynamic: true,
  },
}`;

type CreateSearchIndexModalProps = {
  namespace: string;
  isModalOpen: boolean;
  isBusy: boolean;
  error: string | undefined;
  onCreateIndex: (index: {
    name: string;
    type: SearchIndexType;
    definition: Document;
  }) => void;
  onCloseModal: () => void;
};

export const CreateSearchIndexModal: React.FunctionComponent<
  CreateSearchIndexModalProps
> = ({
  namespace,
  isModalOpen,
  isBusy,
  error,
  onCreateIndex,
  onCloseModal,
}) => {
  return (
    <BaseSearchIndexModal
      namespace={namespace}
      mode={'create'}
      initialIndexName={'default'}
      initialIndexDefinition={DEFAULT_INDEX_DEFINITION}
      isModalOpen={isModalOpen}
      isBusy={isBusy}
      error={error}
      onSubmit={onCreateIndex}
      onClose={onCloseModal}
    />
  );
};

const mapState = ({
  namespace,
  searchIndexes: {
    createIndex: { isBusy, isModalOpen, error },
  },
}: RootState) => ({
  namespace,
  isModalOpen,
  isBusy,
  error,
});

const mapDispatch = {
  onCloseModal: closeCreateModal,
  onCreateIndex: createIndex,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexModal);
