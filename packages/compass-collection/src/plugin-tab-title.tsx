import React from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
import { useTranslation } from 'react-i18next';
import {
  useConnectionInfo,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type { WorkspacePluginProps } from '@mongodb-js/workspace-info';

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
  inferredFromPrivileges,
  isReadonly,
  isTimeSeries,
  sourceName,
  namespace,
  ...tabProps
}: PluginTitleProps) {
  const { t } = useTranslation('compassCollection');
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
    [t('tooltipConnection'), connectionName || ''],
    [t('tooltipDatabase'), database],
  ];
  if (sourceName) {
    tooltip.push([t('tooltipView'), collection]);
    tooltip.push([t('tooltipDerivedFrom'), toNS(sourceName).collection]);
  } else if (editViewName) {
    tooltip.push([t('tooltipView'), toNS(editViewName).collection]);
    tooltip.push([t('tooltipDerivedFrom'), collection]);
  } else {
    tooltip.push([t('tooltipCollection'), collection]);
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
          : inferredFromPrivileges
          ? 'EmptyFolder'
          : 'Folder'
      }
      data-namespace={ns}
      inferredFromPrivileges={inferredFromPrivileges}
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
