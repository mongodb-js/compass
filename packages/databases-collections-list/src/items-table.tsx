import React, { Fragment, useCallback, useMemo } from 'react';
import type {
  LeafyGreenTableCell,
  LGColumnDef,
  HeaderGroup,
  LeafyGreenVirtualItem,
  GroupedItemAction,
} from '@mongodb-js/compass-components';
import {
  css,
  cx,
  spacing,
  WorkspaceContainer,
  Button,
  Icon,
  Breadcrumbs,
  Table,
  TableHead,
  TableBody,
  useLeafyGreenVirtualTable,
  HeaderRow,
  HeaderCell,
  flexRender,
  ExpandedContent,
  Row,
  Cell,
  ItemActionGroup,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import toNS from 'mongodb-ns';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import { usePreferences } from 'compass-preferences-model/provider';

type Item = {
  _id: string;
  name: string;
  inferred_from_privileges?: boolean;
} & Record<string, any>;

export const createButtonStyles = css({
  whiteSpace: 'nowrap',
});

type ItemsTableProps<T> = {
  'data-testid'?: string;
  namespace?: string;
  itemType: 'collection' | 'database';
  columns: LGColumnDef<T>[];
  items: T[];
  onItemClick: (id: string) => void;
  onDeleteItemClick?: (id: string) => void;
  onCreateItemClick?: () => void;
  onRefreshClick?: () => void;
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
  url.searchParams.set('name', clusterName);
  if (database) {
    url.searchParams.set('database', database);
  }
  return url.toString();
}

const TableControls: React.FunctionComponent<{
  namespace?: string;
  itemType: string;
  onCreateItemClick?: () => void;
  onRefreshClick?: () => void;
  renderLoadSampleDataBanner?: () => React.ReactNode;
}> = ({
  namespace,
  itemType,
  onCreateItemClick,
  onRefreshClick,
  renderLoadSampleDataBanner,
}) => {
  const connectionInfo = useConnectionInfo();
  const connectionTitle = getConnectionTitle(connectionInfo);
  const {
    openDatabasesWorkspace,
    openCollectionsWorkspace,
    openShellWorkspace,
  } = useOpenWorkspace();
  const track = useTelemetry();
  const { enableShell: showOpenShellButton } = usePreferences(['enableShell']);

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
          {showOpenShellButton && (
            <Button
              size="small"
              onClick={() => {
                openShellWorkspace(
                  connectionInfo.id,
                  namespace
                    ? { initialEvaluate: `use ${namespace}` }
                    : undefined
                );
                track(
                  'Open Shell',
                  { entrypoint: `${itemType}s` },
                  connectionInfo
                );
              }}
              leftGlyph={<Icon glyph="Shell"></Icon>}
            >
              Open MongoDB shell
            </Button>
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
      {banner && <div className={bannerRowStyles}>{banner}</div>}
    </div>
  );
};

const itemsTableContainerStyles = css({
  width: '100%',
  height: '100%',
});

const virtualScrollingContainerHeight = css({
  width: '100%',
  height: '100%',
  padding: `0 ${spacing[400]}px`,
});

const actionsCellClassName = 'item-actions-cell';

// When row is hovered, we show the delete button
const rowStyles = css({
  ':hover': {
    [`.${actionsCellClassName}`]: {
      button: {
        opacity: 1,
      },
    },
  },
});

// When row is not hovered, we hide the delete button
const actionsCellStyles = css({
  button: {
    opacity: 0,
    '&:focus': {
      opacity: 1,
    },
  },
  minWidth: spacing[800],
});

type ItemAction = 'delete';

// Helper: Build actions array based on item state
const buildItemActions = (
  item: Item,
  {
    readOnly,
    hasDeleteHandler,
  }: { readOnly: boolean; hasDeleteHandler: boolean }
): GroupedItemAction<ItemAction>[] => {
  const actions: GroupedItemAction<ItemAction>[] = [];
  if (!readOnly && hasDeleteHandler && !item.inferred_from_privileges) {
    actions.push({
      action: 'delete',
      label: `Delete ${item.name}`,
      tooltip: `Delete ${item.name}`,
      icon: 'Trash',
    });
  }

  return actions;
};

type ItemActionsProps = {
  item: Item;
  onDeleteItemClick?: (name: string) => void;
};

const ItemActions: React.FunctionComponent<ItemActionsProps> = ({
  item,
  onDeleteItemClick,
}) => {
  const { readOnly } = usePreferences(['readOnly']);
  const itemActions = useMemo(
    () =>
      buildItemActions(item, {
        readOnly,
        hasDeleteHandler: !!onDeleteItemClick,
      }),
    [item, onDeleteItemClick, readOnly]
  );

  const onAction = useCallback(
    (action: ItemAction) => {
      if (action === 'delete') {
        onDeleteItemClick?.(item._id);
      }
    },
    [item, onDeleteItemClick]
  );

  return (
    <ItemActionGroup<ItemAction>
      data-testid="item-actions"
      actions={itemActions}
      onAction={onAction}
    />
  );
};

export const ItemsTable = <T extends Item>({
  'data-testid': dataTestId,
  namespace,
  itemType,
  columns,
  items,
  onItemClick,
  onDeleteItemClick,
  onCreateItemClick,
  onRefreshClick,
  renderLoadSampleDataBanner,
}: ItemsTableProps<T>): React.ReactElement => {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const columnsWithActions = useMemo(() => {
    if (onDeleteItemClick) {
      return [
        ...columns,
        {
          id: 'actions',
          header: '',
          maxSize: 40,
          cell: (info) => {
            return (
              <ItemActions
                item={info.row.original}
                onDeleteItemClick={onDeleteItemClick}
              />
            );
          },
        },
      ];
    }
    return columns;
  }, [columns, onDeleteItemClick]);

  const table = useLeafyGreenVirtualTable<T>({
    containerRef: tableContainerRef,
    data: items,
    columns: columnsWithActions,
    virtualizerOptions: {
      estimateSize: () => 40,
      overscan: 10,
    },
  });

  return (
    <div className={itemsTableContainerStyles} data-testid={dataTestId}>
      <WorkspaceContainer
        toolbar={
          <TableControls
            itemType={itemType}
            namespace={namespace}
            onCreateItemClick={onCreateItemClick}
            onRefreshClick={onRefreshClick}
            renderLoadSampleDataBanner={renderLoadSampleDataBanner}
          ></TableControls>
        }
      >
        <Table
          table={table}
          shouldAlternateRowColor
          ref={tableContainerRef}
          className={virtualScrollingContainerHeight}
          shouldTruncate={false}
        >
          <TableHead isSticky>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<T>) => (
              <HeaderRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <HeaderCell key={header.id} header={header}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </HeaderCell>
                  );
                })}
              </HeaderRow>
            ))}
          </TableHead>
          <TableBody data-testid={`${dataTestId}-body`}>
            {table.virtual.getVirtualItems() &&
              table.virtual
                .getVirtualItems()
                .map((virtualRow: LeafyGreenVirtualItem<T>) => {
                  const row = virtualRow.row;
                  const isExpandedContent = row.isExpandedContent ?? false;

                  return (
                    <Fragment key={row.id}>
                      {!isExpandedContent && (
                        <Row
                          className={rowStyles}
                          data-testid={`${dataTestId}-row-${
                            (row.original as { name?: string }).name ?? row.id
                          }`}
                          row={row}
                          onClick={() => onItemClick(row.original._id)}
                        >
                          {row
                            .getVisibleCells()
                            .map((cell: LeafyGreenTableCell<T>) => {
                              const isActionsCell =
                                cell.column.id === 'actions';

                              return (
                                // cell is required
                                <Cell
                                  key={cell.id}
                                  id={cell.id}
                                  cell={cell}
                                  className={cx({
                                    [actionsCellClassName]: isActionsCell,
                                    [actionsCellStyles]: isActionsCell,
                                  })}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </Cell>
                              );
                            })}
                        </Row>
                      )}
                      {isExpandedContent && <ExpandedContent row={row} />}
                    </Fragment>
                  );
                })}
          </TableBody>
        </Table>
      </WorkspaceContainer>
    </div>
  );
};
