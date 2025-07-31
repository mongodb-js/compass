import React from 'react';
import type { SidebarTreeItem } from './tree-data';
import { css, Icon, ServerIcon, Tooltip } from '@mongodb-js/compass-components';
import type { GlyphName } from '@mongodb-js/compass-components';
import { WithStatusMarker } from './with-status-marker';
import { isLocalhost } from 'mongodb-build-info';

const INFERRED_FROM_PRIVILEGES_TEXT =
  'Your privileges grant you access to this namespace, but it might not currently exist';

const tooltipTriggerStyles = css({
  display: 'flex',
});
const IconWithTooltip = ({
  text,
  glyph,
}: {
  text: string;
  glyph: GlyphName;
}) => {
  return (
    <Tooltip
      align="bottom"
      justify="start"
      trigger={
        <div className={tooltipTriggerStyles}>
          <Icon glyph={glyph} />
        </div>
      }
    >
      {text}
    </Tooltip>
  );
};

export const NavigationItemIcon = ({ item }: { item: SidebarTreeItem }) => {
  if (item.type === 'database') {
    if (item.inferredFromPrivileges) {
      return (
        <IconWithTooltip
          text={INFERRED_FROM_PRIVILEGES_TEXT}
          glyph="EmptyDatabase"
        />
      );
    }
    return <Icon glyph="Database" />;
  }
  if (item.type === 'collection') {
    if (item.inferredFromPrivileges) {
      return (
        <IconWithTooltip
          text={INFERRED_FROM_PRIVILEGES_TEXT}
          glyph="EmptyFolder"
        />
      );
    }
    return <Icon glyph="Folder" />;
  }
  if (item.type === 'view') {
    return <Icon glyph="Visibility" />;
  }
  if (item.type === 'timeseries') {
    return <Icon glyph="TimeSeries" />;
  }
  if (item.type === 'connection') {
    const atlasClusterState = item.connectionInfo.atlasMetadata?.clusterState;
    if (atlasClusterState === 'DELETING' || atlasClusterState === 'CREATING') {
      return (
        <WithStatusMarker status={'disconnected'}>
          <Icon glyph="Refresh" />
        </WithStatusMarker>
      );
    }
    if (atlasClusterState === 'PAUSED' || atlasClusterState === 'DELETED') {
      return (
        <WithStatusMarker status={'disconnected'}>
          <ServerIcon />
        </WithStatusMarker>
      );
    }

    const isFavorite = item.connectionInfo.savedConnectionType === 'favorite';
    if (isFavorite) {
      return (
        <WithStatusMarker status={item.connectionStatus}>
          <Icon glyph="Favorite" />
        </WithStatusMarker>
      );
    }
    if (isLocalhost(item.connectionInfo.connectionOptions.connectionString)) {
      return (
        <WithStatusMarker status={item.connectionStatus}>
          <Icon glyph="Laptop" />
        </WithStatusMarker>
      );
    }
    return (
      <WithStatusMarker status={item.connectionStatus}>
        <ServerIcon />
      </WithStatusMarker>
    );
  }
  return null;
};
