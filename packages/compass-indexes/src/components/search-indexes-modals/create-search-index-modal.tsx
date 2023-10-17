import React from 'react';
import { closeCreateModal, createIndex } from '../../modules/search-indexes';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { Document } from 'mongodb';
import { BaseSearchIndexModal } from './base-search-index-modal';
import type { Field } from '../../modules/fields';

export const DEFAULT_INDEX_DEFINITION = `{
  mappings: {
    dynamic: true,
  },
}`;

type CreateSearchIndexModalProps = {
  isModalOpen: boolean;
  isBusy: boolean;
  error: string | undefined;
  fields: Field[];
  onCreateIndex: (indexName: string, indexDefinition: Document) => void;
  onCloseModal: () => void;
};

export const CreateSearchIndexModal: React.FunctionComponent<
  CreateSearchIndexModalProps
> = ({ isModalOpen, isBusy, error, fields, onCreateIndex, onCloseModal }) => {
  return (
    <BaseSearchIndexModal
      mode={'create'}
      initialIndexName={'default'}
      initialIndexDefinition={DEFAULT_INDEX_DEFINITION}
      isModalOpen={isModalOpen}
      isBusy={isBusy}
      error={error}
      fields={fields}
      onSubmit={onCreateIndex}
      onClose={onCloseModal}
    />
  );
};

const mapState = ({
  searchIndexes: {
    createIndex: { isBusy, isModalOpen, error },
  },
  fields,
}: RootState) => ({
  isModalOpen,
  isBusy,
  error,
  fields,
});

const mapDispatch = {
  onCloseModal: closeCreateModal,
  onCreateIndex: createIndex,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexModal);
