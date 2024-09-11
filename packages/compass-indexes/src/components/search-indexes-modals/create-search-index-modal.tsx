import React from 'react';
import {
  createSearchIndexClosed,
  createIndex,
} from '../../modules/search-indexes';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { Document } from 'mongodb';
import {
  BaseSearchIndexModal,
  DEFAULT_INDEX_DEFINITION,
} from './base-search-index-modal';
import { isAtlasVectorSearchSupportedForServerVersion } from '../../utils/vector-search-indexes';

type CreateSearchIndexModalProps = {
  namespace: string;
  isModalOpen: boolean;
  isBusy: boolean;
  isVectorSearchSupported: boolean;
  error: string | undefined;
  onCreateIndex: (index: {
    name: string;
    type?: string;
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
  isVectorSearchSupported,
  error,
  onCreateIndex,
  onCloseModal,
}) => {
  return (
    <BaseSearchIndexModal
      namespace={namespace}
      mode={'create'}
      isVectorSearchSupported={isVectorSearchSupported}
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
  serverVersion,
  namespace,
  searchIndexes: {
    createIndex: { isBusy, isModalOpen, error },
  },
}: RootState) => ({
  isVectorSearchSupported:
    isAtlasVectorSearchSupportedForServerVersion(serverVersion),
  namespace,
  isModalOpen,
  isBusy,
  error,
});

const mapDispatch = {
  onCloseModal: createSearchIndexClosed,
  onCreateIndex: createIndex,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexModal);
