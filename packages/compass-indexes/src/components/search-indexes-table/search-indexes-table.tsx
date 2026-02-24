import React, { useCallback, useEffect } from 'react';
import { connect, useSelector } from 'react-redux';
import type { SearchIndex } from 'mongodb-data-service';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  Button,
  EmptyContent,
  Link,
  Tooltip,
} from '@mongodb-js/compass-components';

import { FetchStatuses } from '../../utils/fetch-status';
import {
  dropSearchIndex,
  getInitialSearchIndexPipeline,
  getInitialVectorSearchIndexPipelineText,
  createSearchIndexOpened,
  updateSearchIndexOpened,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
} from '../../modules/search-indexes';
import type { FetchStatus } from '../../utils/fetch-status';
import { IndexesTable } from '../indexes-table';
import SearchIndexActions from './search-index-actions';
import { ZeroRegularIndexesGraphic } from '../icons/zero-regular-indexes-graphic';
import type { RootState } from '../../modules';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { useWorkspaceTabId } from '@mongodb-js/compass-workspaces/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { usePreferences } from 'compass-preferences-model/provider';
import { selectReadWriteAccess } from '../../utils/indexes-read-write-access';
import { selectIsViewSearchCompatible } from '../../utils/is-view-search-compatible';

import { useSearchIndexesTable } from './use-search-indexes-table';
import { COLUMNS, COLUMNS_WITH_ACTIONS } from './search-indexes-columns';

type SearchIndexesTableProps = {
  namespace: string;
  indexes: SearchIndex[];
  isReadonlyView: boolean;
  status: FetchStatus;
  onDropIndexClick: (name: string) => void;
  onEditIndexClick: (name: string) => void;
  onOpenCreateModalClick: () => void;
  onSearchIndexesOpened: (tabId: string) => void;
  onSearchIndexesClosed: (tabId: string) => void;
};

function isReadyStatus(status: FetchStatus) {
  return (
    status === FetchStatuses.READY ||
    status === FetchStatuses.REFRESHING ||
    status === FetchStatuses.POLLING
  );
}

function ZeroState({
  onOpenCreateModalClick,
  isReadonlyView,
  isViewPipelineSearchQueryable,
}: {
  onOpenCreateModalClick: () => void;
  isReadonlyView: boolean;
  isViewPipelineSearchQueryable: boolean;
}) {
  const track = useTelemetry();
  const isViewAndPipelineSearchNonQueryable =
    isReadonlyView && !isViewPipelineSearchQueryable;

  return (
    <EmptyContent
      icon={ZeroRegularIndexesGraphic}
      title="No search indexes yet"
      subTitle="Atlas Search is an embedded full-text search in MongoDB Atlas that gives you a seamless, scalable experience for building relevance-based app features."
      callToAction={
        <Tooltip
          enabled={isViewAndPipelineSearchNonQueryable}
          align="top"
          justify="middle"
          trigger={
            <Button
              onClick={() => {
                onOpenCreateModalClick();
                if (isReadonlyView) {
                  track('Create Search Index for View Clicked', {
                    context: 'Indexes Tab',
                  });
                }
              }}
              data-testid="create-atlas-search-index-button"
              variant="primary"
              size="small"
              // TODO(COMPASS-10353): disable for other non-writable cases as well
              disabled={isViewAndPipelineSearchNonQueryable}
            >
              Create Atlas Search Index
            </Button>
          }
        >
          Search indexes can only be created on views containing $match stages
          with the $expr operator, $addFields, or $set.
        </Tooltip>
      }
      callToActionLink={
        <span>
          Not sure where to start?&nbsp;
          <Link
            href="https://www.mongodb.com/docs/atlas/atlas-search/"
            target="_blank"
          >
            Visit our Docs
          </Link>
        </span>
      }
    />
  );
}

export const SearchIndexesTable: React.FunctionComponent<
  SearchIndexesTableProps
> = ({
  namespace,
  indexes,
  isReadonlyView,
  status,
  onOpenCreateModalClick,
  onEditIndexClick,
  onDropIndexClick,
  onSearchIndexesOpened,
  onSearchIndexesClosed,
}) => {
  const { openCollectionWorkspace } = useOpenWorkspace();
  const { id: connectionId, atlasMetadata } = useConnectionInfo();
  const isAtlas = !!atlasMetadata;

  const tabId = useWorkspaceTabId();

  const { readOnly, readWrite, enableAtlasSearchIndexes } = usePreferences([
    'readOnly',
    'readWrite',
    'enableAtlasSearchIndexes',
  ]);

  useEffect(() => {
    onSearchIndexesOpened(tabId);
    return () => {
      onSearchIndexesClosed(tabId);
    };
  }, [tabId, onSearchIndexesOpened, onSearchIndexesClosed]);
  const { isSearchIndexesWritable } = useSelector(
    selectReadWriteAccess({
      isAtlas,
      readOnly,
      readWrite,
      enableAtlasSearchIndexes,
    })
  );
  const { isViewPipelineSearchQueryable } = useSelector(
    selectIsViewSearchCompatible(isAtlas)
  );

  const { data } = useSearchIndexesTable({
    indexes,
    vectorTypeLabel: 'Vector Search',
    renderActions: useCallback(
      (index: SearchIndex, isVectorSearchIndex: boolean) => (
        <SearchIndexActions
          index={index}
          onDropIndex={onDropIndexClick}
          onEditIndex={onEditIndexClick}
          onRunAggregateIndex={(name: string) => {
            openCollectionWorkspace(connectionId, namespace, {
              newTab: true,
              ...(isVectorSearchIndex
                ? {
                    initialPipelineText:
                      getInitialVectorSearchIndexPipelineText(name),
                  }
                : {
                    initialPipeline: getInitialSearchIndexPipeline(name),
                  }),
            });
          }}
        />
      ),
      [
        connectionId,
        namespace,
        onDropIndexClick,
        onEditIndexClick,
        openCollectionWorkspace,
      ]
    ),
  });

  if (!isReadyStatus(status)) {
    // If there's an error or the search indexes are still pending or search
    // indexes aren't available, then that's all handled by the toolbar and we
    // don't render the table.
    return null;
  }

  if (indexes.length === 0) {
    return (
      <ZeroState
        onOpenCreateModalClick={onOpenCreateModalClick}
        isReadonlyView={isReadonlyView}
        isViewPipelineSearchQueryable={isViewPipelineSearchQueryable}
      />
    );
  }

  return (
    <IndexesTable
      id="search-indexes"
      data-testid="search-indexes"
      columns={isSearchIndexesWritable ? COLUMNS_WITH_ACTIONS : COLUMNS}
      data={data}
    />
  );
};

const mapState = ({ searchIndexes, namespace, isReadonlyView }: RootState) => ({
  namespace,
  isReadonlyView,
  indexes: searchIndexes.indexes,
  status: searchIndexes.status,
});

const mapDispatch = {
  onDropIndexClick: dropSearchIndex,
  onOpenCreateModalClick: createSearchIndexOpened,
  onEditIndexClick: updateSearchIndexOpened,
  onSearchIndexesOpened: startPollingSearchIndexes,
  onSearchIndexesClosed: stopPollingSearchIndexes,
};

export default connect(mapState, mapDispatch)(SearchIndexesTable);
