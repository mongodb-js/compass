import React from 'react';
import { closeModalForUpdate, updateIndex } from '../../modules/search-indexes';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { Document } from 'mongodb';
import { BaseSearchIndexModal } from './base-search-index-modal';

type UpdateSearchIndexModalProps = {
  indexName: string;
  indexDefinition: string;
  isModalOpen: boolean;
  isBusy: boolean;
  error: string | undefined;
  updateIndex: (indexName: string, indexDefinition: Document) => void;
  closeModal: () => void;
};

export const UpdateSearchIndexModal: React.FunctionComponent<
  UpdateSearchIndexModalProps
> = ({
  indexName,
  indexDefinition,
  isModalOpen,
  isBusy,
  error,
  updateIndex,
  closeModal,
}) => {
  return (
    <BaseSearchIndexModal
      title={'Update Search Index'}
      submitActionName={'Update Search Index'}
      initialIndexName={indexName}
      initialIndexDefinition={indexDefinition}
      isIndexNameReadonly={true}
      isModalOpen={isModalOpen}
      isBusy={isBusy}
      error={error}
      submitIndex={updateIndex}
      closeModal={closeModal}
    />
  );
};

const mapState = ({ searchIndexes }: RootState) => ({
  isModalOpen: searchIndexes.updateIndex.isModalOpen,
  isBusy: searchIndexes.updateIndex.isBusy,
  indexName: searchIndexes.updateIndex.indexName,
  indexDefinition: searchIndexes.updateIndex.indexDefinition,
  error: searchIndexes.error,
});

const mapDispatch = {
  closeModal: closeModalForUpdate,
  updateIndex,
};

export default connect(mapState, mapDispatch)(UpdateSearchIndexModal);
