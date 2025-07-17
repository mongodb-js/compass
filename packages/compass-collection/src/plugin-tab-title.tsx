import React from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
import {
  useConnectionInfo,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type { WorkspacePluginProps } from '@mongodb-js/compass-workspaces';

import { type CollectionState } from './modules/collection-tab';

export const CollectionWorkspaceTitle = 'Collection' as const;

type PluginTitleProps = {
  isTimeSeries?: boolean;
  isReadonly?: boolean;
  sourceName?: string | null;
} & WorkspaceTabCoreProps &
  WorkspacePluginProps<typeof CollectionWorkspaceTitle>;

function PluginTitle({
  editViewName,
  isNonExistent,
  isReadonly,
  isTimeSeries,
  sourceName,
  namespace,
  ...tabProps
}: PluginTitleProps) {
  const { getConnectionById } = useConnectionsListRef();
  const { id: connectionId } = useConnectionInfo();

  const { database, collection, ns } = toNS(namespace);
  const connectionName = getConnectionById(connectionId)?.title || '';
  const collectionType = isTimeSeries
    ? 'timeseries'
    : isReadonly
    ? 'view'
    : 'collection';
  // Similar to what we have in the collection breadcrumbs.
  const tooltip: [string, string][] = [
    ['Connection', connectionName || ''],
    ['Database', database],
  ];
  if (sourceName) {
    tooltip.push(['View', collection]);
    tooltip.push(['Derived from', toNS(sourceName).collection]);
  } else if (editViewName) {
    tooltip.push(['View', toNS(editViewName).collection]);
    tooltip.push(['Derived from', collection]);
  } else {
    tooltip.push(['Collection', collection]);
  }

  return (
    <WorkspaceTab
      {...tabProps}
      connectionName={connectionName}
      type={CollectionWorkspaceTitle}
      title={collection}
      tooltip={tooltip}
      iconGlyph={
        collectionType === 'view'
          ? 'Visibility'
          : collectionType === 'timeseries'
          ? 'TimeSeries'
          : isNonExistent
          ? 'EmptyFolder'
          : 'Folder'
      }
      data-namespace={ns}
      isNonExistent={isNonExistent}
    />
  );
}

export const CollectionPluginTitleComponent = connect(
  (state: CollectionState) => ({
    isTimeSeries: state.metadata?.isTimeSeries,
    isReadonly: state.metadata?.isReadonly,
    sourceName: state.metadata?.sourceName,
  })
)(PluginTitle);
