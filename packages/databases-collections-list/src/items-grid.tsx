import React, { useCallback, useMemo } from 'react';
import {
  css,
  cx,
  spacing,
  VirtualGrid,
  useSortControls,
  useSortedItems,
  WorkspaceContainer,
  Button,
  Icon,
  Breadcrumbs,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import type { NamespaceItemCardProps } from './namespace-card';
import { useViewTypeControls } from './use-view-type';
import type { ViewType } from './use-view-type';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import toNS from 'mongodb-ns';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import { useConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

type Item = { _id: string } & Record<string, unknown>;

const rowStyles = css({
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  paddingBottom: spacing[2],
  columnGap: spacing[2],
});

const containerStyles = css({
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  gridTemplateColumns: '100%',
  // This element is focusable only to handle virtual list and will immediately
  // pass focus to its children. This can take a frame though so to avoid
  // outline on the container showing up, we are completely disabling it
  outline: 'none',
});

export const createButtonStyles = css({
  whiteSpace: 'nowrap',
});

type CallbackProps = {
  onItemClick(id: string): void;
  onCreateItemClick?: () => void;
  onDeleteItemClick?: (id: string) => void;
};

interface RenderItem<T> {
  (
    props: {
      item: T;
      viewType: ViewType;
    } & Omit<CallbackProps, 'onCreateItemClick'> &
      Omit<
        React.HTMLProps<HTMLDivElement>,
        Extract<keyof NamespaceItemCardProps, string>
      >
  ): React.ReactElement;
}

type ItemsGridProps<T> = {
  namespace?: string;
  itemType: 'collection' | 'database';
  itemGridWidth: number;
  itemGridHeight: number;
  itemListWidth?: number;
  itemListHeight?: number;
  items: T[];
  sortBy?: { name: Extract<keyof T, string>; label: string }[];
  onItemClick(id: string): void;
  onDeleteItemClick?: (id: string) => void;
  onCreateItemClick?: () => void;
  onRefreshClick?: () => void;
  renderItem: RenderItem<T>;
  renderLoadSampleDataBanner?: () => React.ReactNode;
};

const controlsContainerStyles = css({
  paddingTop: spacing[200],
  paddingRight: spacing[400],
  paddingBottom: spacing[400],
  paddingLeft: spacing[400],

  display: 'grid',
  gridTemplate: '1fr / 100%',
  gap: spacing[200],
});

const controlRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const controlStyles = css({
  flex: 'none',
});

const breadcrumbContainerStyles = css({
  display: 'flex',
  minWidth: 0,
  paddingTop: spacing[200],
  paddingBottom: spacing[200],
});

const pushRightStyles = css({
  marginLeft: 'auto',
});

const bannerRowStyles = css({
  paddingTop: spacing[200],
});

function buildChartsUrl(
  groupId: string,
  clusterName: string,
  namespace?: string
) {
  const { database } = toNS(namespace ?? '');
  const url = new URL(`/charts/${groupId}`, window.location.origin);
  url.searchParams.set('sourceType', 'cluster');
  url.searchParams.set('instanceName', clusterName);
  if (database) {
    url.searchParams.set('database', database);
  }
  return url.toString();
}

const GridControls: React.FunctionComponent<{
  namespace?: string;
  itemType: string;
  sortControls?: React.ReactNode;
  viewTypeControls?: React.ReactNode;
  onCreateItemClick?: () => void;
  onRefreshClick?: () => void;
  renderLoadSampleDataBanner?: () => React.ReactNode;
}> = ({
  namespace,
  itemType,
  sortControls,
  viewTypeControls,
  onCreateItemClick,
  onRefreshClick,
  renderLoadSampleDataBanner,
}) => {
  const connectionInfo = useConnectionInfo();
  const connectionTitle = getConnectionTitle(connectionInfo);
  const { openDatabasesWorkspace, openCollectionsWorkspace } =
    useOpenWorkspace();

  const breadcrumbs = useMemo(() => {
    const { database } = toNS(namespace ?? '');
    const items = [
      {
        name: connectionTitle,
        onClick: () => {
          openDatabasesWorkspace(connectionInfo.id);
        },
      },
    ];

    if (database) {
      items.push({
        name: database,
        onClick: () => {
          openCollectionsWorkspace(connectionInfo.id, database);
        },
      });
    }

    return items;
  }, [
    connectionInfo.id,
    connectionTitle,
    namespace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
  ]);

  const banner = renderLoadSampleDataBanner?.();

  return (
    <div className={controlsContainerStyles}>
      <div className={controlRowStyles}>
        <div className={breadcrumbContainerStyles}>
          <Breadcrumbs items={breadcrumbs}></Breadcrumbs>
        </div>

        <div className={cx(controlRowStyles, controlStyles, pushRightStyles)}>
          {onCreateItemClick && (
            <div className={controlStyles} data-testid="create-controls">
              <Button
                variant="primary"
                leftGlyph={<Icon role="presentation" glyph="Plus" />}
                onClick={onCreateItemClick}
                className={createButtonStyles}
                size="small"
              >
                Create {itemType}
              </Button>
            </div>
          )}

          {connectionInfo.atlasMetadata && (
            <Button
              data-testid={`${itemType}-header-visualize-your-data`}
              size="small"
              href={buildChartsUrl(
                connectionInfo.atlasMetadata.projectId,
                connectionInfo.atlasMetadata.clusterName,
                namespace
              )}
              target="_self"
              rel="noopener noreferrer"
              leftGlyph={<Icon glyph="Charts" />}
            >
              Visualize your data
            </Button>
          )}

          {onRefreshClick && (
            <div className={controlStyles} data-testid="refresh-controls">
              <Button
                variant="default"
                leftGlyph={<Icon role="presentation" glyph="Refresh" />}
                onClick={onRefreshClick}
                size="small"
              >
                Refresh
              </Button>
            </div>
          )}
        </div>
      </div>
      {sortControls && viewTypeControls && (
        <div className={controlRowStyles}>
          <div className={controlStyles}>{sortControls}</div>
          <div className={cx(controlStyles, pushRightStyles)}>
            {viewTypeControls}
          </div>
        </div>
      )}
      {banner && <div className={bannerRowStyles}>{banner}</div>}
    </div>
  );
};

const itemsGridContainerStyles = css({
  width: '100%',
  height: '100%',
});

export const ItemsGrid = <T extends Item>({
  namespace,
  itemType,
  itemGridWidth,
  itemGridHeight,
  itemListWidth = itemGridWidth,
  itemListHeight = itemGridHeight,
  items,
  sortBy = [],
  onItemClick,
  onDeleteItemClick,
  onCreateItemClick,
  onRefreshClick,
  renderItem: _renderItem,
  renderLoadSampleDataBanner,
}: ItemsGridProps<T>): React.ReactElement => {
  const track = useTelemetry();
  const connectionInfoAccess = useConnectionInfoAccess();
  const onViewTypeChange = useCallback(
    (newType) => {
      track(
        'Switch View Type',
        { view_type: newType, item_type: itemType },
        connectionInfoAccess.getCurrentConnectionInfo()
      );
    },
    [itemType, track, connectionInfoAccess]
  );

  const [sortControls, sortState] = useSortControls(sortBy);
  const [viewTypeControls, viewType] = useViewTypeControls({
    onChange: onViewTypeChange,
  });
  const sortedItems = useSortedItems(items, sortState);

  const itemWidth = viewType === 'grid' ? itemGridWidth : itemListWidth;
  const itemHeight = viewType === 'grid' ? itemGridHeight : itemListHeight;

  const shouldShowControls = items.length > 0;

  const renderItem: React.ComponentProps<typeof VirtualGrid>['renderItem'] =
    useCallback(
      ({ index, ...props }) => {
        const item = sortedItems[index];
        return _renderItem({
          item,
          viewType,
          onItemClick,
          onDeleteItemClick,
          ...props,
        });
      },
      [_renderItem, onDeleteItemClick, onItemClick, sortedItems, viewType]
    );

  return (
    <div className={itemsGridContainerStyles}>
      <WorkspaceContainer
        toolbar={
          <GridControls
            itemType={itemType}
            namespace={namespace}
            sortControls={shouldShowControls ? sortControls : undefined}
            viewTypeControls={shouldShowControls ? viewTypeControls : undefined}
            onCreateItemClick={onCreateItemClick}
            onRefreshClick={onRefreshClick}
            renderLoadSampleDataBanner={renderLoadSampleDataBanner}
          ></GridControls>
        }
      >
        {(scrollTriggerRef) => {
          return (
            <VirtualGrid
              itemMinWidth={itemWidth}
              itemHeight={itemHeight + (spacing[2] as number)}
              itemsCount={sortedItems.length}
              colCount={viewType === 'list' ? 1 : undefined}
              renderItem={renderItem}
              renderHeader={() => {
                return <div ref={scrollTriggerRef}></div>;
              }}
              headerHeight={0}
              itemKey={(index: number) => sortedItems[index]._id}
              classNames={{ container: containerStyles, row: rowStyles }}
              resetActiveItemOnBlur={false}
              data-testid={`${itemType}-grid`}
            ></VirtualGrid>
          );
        }}
      </WorkspaceContainer>
    </div>
  );
};
