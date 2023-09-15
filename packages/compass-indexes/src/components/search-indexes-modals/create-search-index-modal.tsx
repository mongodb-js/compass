import React from 'react';
import {
  closeModalForCreation,
  createIndex,
} from '../../modules/search-indexes';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { Document } from 'mongodb';
import { BaseSearchIndexModal } from './base-search-index-modal';

export const DEFAULT_INDEX_DEFINITION = `{
  "mappings": {
    "dynamic": true
  }
}`;

type CreateSearchIndexModalProps = {
  isModalOpen: boolean;
  isBusy: boolean;
  error: string | undefined;
  createIndex: (indexName: string, indexDefinition: Document) => void;
  closeModal: () => void;
};

export const CreateSearchIndexModal: React.FunctionComponent<
  CreateSearchIndexModalProps
> = ({ isModalOpen, isBusy, error, createIndex, closeModal }) => {
  return (
    <BaseSearchIndexModal
      title={'Create Search Index'}
      submitActionName={'Create Search Index'}
      initialIndexName={'default'}
      initialIndexDefinition={DEFAULT_INDEX_DEFINITION}
      isIndexNameReadonly={false}
      isModalOpen={isModalOpen}
      isBusy={isBusy}
      error={error}
      submitIndex={createIndex}
      closeModal={closeModal}
    />
  );
};

const mapState = ({ searchIndexes }: RootState) => ({
  isModalOpen: searchIndexes.createIndex.isModalOpen,
  isBusy: searchIndexes.createIndex.isBusy,
  error: searchIndexes.error,
});

const mapDispatch = {
  closeModal: closeModalForCreation,
  createIndex,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexModal);
