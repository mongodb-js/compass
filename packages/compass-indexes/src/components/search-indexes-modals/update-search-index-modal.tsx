import React from 'react';
import { closeUpdateModal, updateIndex } from '../../modules/search-indexes';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { Document } from 'mongodb';
import { BaseSearchIndexModal } from './base-search-index-modal';
import { isAtlasVectorSearchSupportedForServerVersion } from '../../utils/vector-search-indexes';

type UpdateSearchIndexModalProps = {
  namespace: string;
  indexName: string;
  indexDefinition: string;
  indexType?: string;
  isModalOpen: boolean;
  isBusy: boolean;
  isVectorSearchSupported: boolean;
  error: string | undefined;
  onUpdateIndex: (index: {
    name: string;
    type?: string;
    definition: Document;
  }) => void;
  onCloseModal: () => void;
};

export const UpdateSearchIndexModal: React.FunctionComponent<
  UpdateSearchIndexModalProps
> = ({
  namespace,
  indexName,
  indexDefinition,
  indexType,
  isModalOpen,
  isBusy,
  isVectorSearchSupported,
  error,
  onUpdateIndex,
  onCloseModal,
}) => {
  return (
    <BaseSearchIndexModal
      namespace={namespace}
      isVectorSearchSupported={isVectorSearchSupported}
      mode={'update'}
      initialIndexName={indexName}
      initialIndexType={indexType}
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
  serverVersion,
  namespace,
  searchIndexes: {
    indexes,
    updateIndex: { indexName, isBusy, isModalOpen, error },
  },
}: RootState) => {
  const index = indexes.find((x) => x.name === indexName);
  return {
    isVectorSearchSupported:
      isAtlasVectorSearchSupportedForServerVersion(serverVersion),
    namespace,
    isModalOpen,
    isBusy,
    indexName,
    indexDefinition: JSON.stringify(index?.latestDefinition, null, 2),
    indexType: index?.type,
    error,
  };
};

const mapDispatch = {
  onCloseModal: closeUpdateModal,
  onUpdateIndex: updateIndex,
};

export default connect(mapState, mapDispatch)(UpdateSearchIndexModal);
