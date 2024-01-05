import React from 'react';
import { closeUpdateModal, updateIndex } from '../../modules/search-indexes';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { Document } from 'mongodb';
import { BaseSearchIndexModal } from './base-search-index-modal';

type UpdateSearchIndexModalProps = {
  namespace: string;
  indexName: string;
  indexDefinition: string;
  isModalOpen: boolean;
  isBusy: boolean;
  error: string | undefined;
  onUpdateIndex: (indexName: string, indexDefinition: Document) => void;
  onCloseModal: () => void;
};

export const UpdateSearchIndexModal: React.FunctionComponent<
  UpdateSearchIndexModalProps
> = ({
  namespace,
  indexName,
  indexDefinition,
  isModalOpen,
  isBusy,
  error,
  onUpdateIndex,
  onCloseModal,
}) => {
  return (
    <BaseSearchIndexModal
      namespace={namespace}
      mode={'update'}
      initialIndexName={indexName}
      initialIndexDefinition={indexDefinition}
      isModalOpen={isModalOpen}
      isBusy={isBusy}
      error={error}
      onSubmit={onUpdateIndex}
      onClose={onCloseModal}
    />
  );
};

const mapState = ({
  namespace,
  searchIndexes: {
    indexes,
    updateIndex: { indexName, isBusy, isModalOpen, error },
  },
}: RootState) => ({
  namespace,
  isModalOpen,
  isBusy,
  indexName,
  indexDefinition: JSON.stringify(
    indexes.find((x) => x.name === indexName)?.latestDefinition,
    null,
    2
  ),
  error,
});

const mapDispatch = {
  onCloseModal: closeUpdateModal,
  onUpdateIndex: updateIndex,
};

export default connect(mapState, mapDispatch)(UpdateSearchIndexModal);
