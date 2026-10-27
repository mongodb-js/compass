import React from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import {
  createSearchIndexClosed,
  createIndex,
  createSearchIndexErrorCleared,
} from '../../modules/search-indexes';
import type { RootState } from '../../modules';
import { isAtlasVectorSearchSupportedForServerVersion } from '../../utils/vector-search-indexes';
import {
  BaseSearchIndexModal,
  DEFAULT_INDEX_DEFINITION,
} from './base-search-index-modal';

type CreateSearchIndexModalProps = {
  namespace: string;
  isModalOpen: boolean;
  isBusy: boolean;
  isVectorSearchSupported: boolean;
  error: string | undefined;
  onCreateIndexClick: (index: {
    name: string;
    type?: string;
    definition: Document;
  }) => void;
  onCloseModalClick: () => void;
  onClearError: () => void;
};

export const CreateSearchIndexModal: React.FunctionComponent<
  CreateSearchIndexModalProps
> = ({
  namespace,
  isModalOpen,
  isBusy,
  isVectorSearchSupported,
  error,
  onCreateIndexClick,
  onCloseModalClick,
  onClearError,
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
      onSubmit={onCreateIndexClick}
      onClose={onCloseModalClick}
      onClearError={onClearError}
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
  onCloseModalClick: createSearchIndexClosed,
  onCreateIndexClick: createIndex,
  onClearError: createSearchIndexErrorCleared,
};

export default connect(mapState, mapDispatch)(CreateSearchIndexModal);
