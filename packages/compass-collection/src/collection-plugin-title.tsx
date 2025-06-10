import React from 'react';
import toNS from 'mongodb-ns';
import {
  useConnectionsListRef,
  useTabConnectionTheme,
} from '@mongodb-js/compass-connections/provider';
import { css, palette } from '@mongodb-js/compass-components';

// TODO: Share somewhere?
type Tooltip = [string, string][];
const nonExistentStyles = css({
  color: palette.gray.base,
});

// TODO: Where to type this? Right now it's here and in compass-workspaces.
type CollectionSubtab =
  | 'Documents'
  | 'Aggregations'
  | 'Schema'
  | 'Indexes'
  | 'Validation'
  | 'GlobalWrites';

export const CollectionWorkspaceTitle = 'Collection' as const;
export function CollectionPluginTitle() {
  return (tabProps: {
    id: string;
    connectionId: string;
    namespace: string;
    subTab: CollectionSubtab;
    initialQuery?: unknown;
    initialPipeline?: unknown[];
    initialPipelineText?: string;
    initialAggregation?: unknown;
    editViewName?: string;

    // TODO: We shouldn't get this from here.
    collectionInfo: Record<
      string,
      {
        isTimeSeries: boolean;
        isReadonly: boolean;
        sourceName?: string | null;
        isNonExistent: boolean;
      }
    >;
    // initialEvaluate?: string | string[];
    // initialInput?: string;
    // type: typeof WorkspaceName;
  }) => {
    // TODO: We need these in the react life cycle.
    const { getThemeOf } = useTabConnectionTheme();
    const { getConnectionById } = useConnectionsListRef();

    const { database, collection, ns } = toNS(tabProps.namespace);
    const namespaceId = `${tabProps.connectionId}.${ns}`;
    const info = tabProps.collectionInfo[namespaceId] ?? {};
    const { isTimeSeries, isReadonly, sourceName, isNonExistent } = info;
    const connectionName =
      getConnectionById(tabProps.connectionId)?.title || '';
    const collectionType = isTimeSeries
      ? 'timeseries'
      : isReadonly
      ? 'view'
      : 'collection';
    // Similar to what we have in the collection breadcrumbs.
    const tooltip: Tooltip = [
      ['Connection', connectionName || ''],
      ['Database', database],
    ];
    if (sourceName) {
      tooltip.push(['View', collection]);
      tooltip.push(['Derived from', toNS(sourceName).collection]);
    } else if (tabProps.editViewName) {
      tooltip.push(['View', toNS(tabProps.editViewName).collection]);
      tooltip.push(['Derived from', collection]);
    } else {
      tooltip.push(['Collection', collection]);
    }
    return {
      id: tabProps.id,
      connectionName,
      type: CollectionWorkspaceTitle,
      title: collection,
      tooltip,
      iconGlyph:
        collectionType === 'view'
          ? 'Visibility'
          : collectionType === 'timeseries'
          ? 'TimeSeries'
          : isNonExistent
          ? 'EmptyFolder'
          : 'Folder',
      'data-namespace': ns,
      tabTheme: getThemeOf(tabProps.connectionId),
      ...(isNonExistent && {
        className: nonExistentStyles,
      }),
    } as const;
  };
}
