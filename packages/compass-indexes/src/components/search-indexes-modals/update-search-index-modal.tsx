import React from 'react';
import {
  updateSearchIndexClosed,
  updateIndex,
} from '../../modules/search-indexes';
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
  onUpdateIndexClick: (index: {
    name: string;
    type?: string;
    definition: Document;
  }) => void;
  onCloseModalClick: () => void;
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
  onUpdateIndexClick,
  onCloseModalClick,
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
      onSubmit={onUpdateIndexClick}
      onClose={onCloseModalClick}
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
  onCloseModalClick: updateSearchIndexClosed,
  onUpdateIndexClick: updateIndex,
};

export default connect(mapState, mapDispatch)(UpdateSearchIndexModal);
