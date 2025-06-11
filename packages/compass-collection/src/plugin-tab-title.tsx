import React from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
import {
  useConnectionsListRef,
  useTabConnectionTheme,
} from '@mongodb-js/compass-connections/provider';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';

import { type CollectionState } from './modules/collection-tab';

type WorkspaceProps = {
  id: string;
  connectionId: string;
  namespace: string;
  subTab: CollectionSubtab;
  initialQuery?: unknown;
  initialPipeline?: unknown[];
  initialPipelineText?: string;
  initialAggregation?: unknown;
  editViewName?: string;
  isNonExistent: boolean;
};

function _PluginTitle({
  isTimeSeries,
  isReadonly,
  sourceName,
  tabProps,
  workspaceProps,
}: {
  isTimeSeries?: boolean;
  isReadonly?: boolean;
  sourceName?: string | null;
  tabProps: WorkspaceTabCoreProps;
  workspaceProps: WorkspaceProps;
}) {
  const { getThemeOf } = useTabConnectionTheme();
  const { getConnectionById } = useConnectionsListRef();

  const { database, collection, ns } = toNS(workspaceProps.namespace);
  const namespaceId = `${workspaceProps.connectionId}.${ns}`;
  const connectionName =
    getConnectionById(workspaceProps.connectionId)?.title || '';
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
  } else if (workspaceProps.editViewName) {
    tooltip.push(['View', toNS(workspaceProps.editViewName).collection]);
    tooltip.push(['Derived from', collection]);
  } else {
    tooltip.push(['Collection', collection]);
  }

  return (
    <WorkspaceTab
      {...tabProps}
      id={workspaceProps.id}
      connectionName={connectionName}
      type={CollectionWorkspaceTitle}
      title={collection}
      tooltip={tooltip}
      iconGlyph={
        collectionType === 'view'
          ? 'Visibility'
          : collectionType === 'timeseries'
          ? 'TimeSeries'
          : workspaceProps.isNonExistent
          ? 'EmptyFolder'
          : 'Folder'
      }
      data-namespace={ns}
      tabTheme={getThemeOf(workspaceProps.connectionId)}
      isNonExistent={workspaceProps.isNonExistent}
    />
  );
}

const ConnectedPluginTitle = connect((state: CollectionState) => ({
  // TODO: Need to check the implications of moving this metadata here
  // instead of having it passed from the workspaces store.
  isTimeSeries: state.metadata?.isTimeSeries,
  isReadonly: state.metadata?.isReadonly,
  sourceName: state.metadata?.sourceName,
}))(_PluginTitle);

export const CollectionWorkspaceTitle = 'Collection' as const;
export function CollectionPluginTitleComponent({
  tabProps,
  workspaceProps,
}: {
  tabProps: WorkspaceTabCoreProps;
  workspaceProps: WorkspaceProps;
}) {
  return (
    <ConnectedPluginTitle tabProps={tabProps} workspaceProps={workspaceProps} />
  );
}
