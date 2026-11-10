import React from 'react';
import {
  css,
  Icon,
  palette,
  ServerIcon,
  Tooltip,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { GlyphName } from '@mongodb-js/compass-components';
import { isLocalhost } from '@mongodb-js/mongodb-build-info';
import { WithStatusMarker } from './with-status-marker';
import type { SidebarTreeItem } from './tree-data';

const INFERRED_FROM_PRIVILEGES_TEXT =
  'Your privileges grant you access to this namespace, but it might not currently exist';

const FolderIcon = () => {
  const darkMode = useDarkMode();
  const stroke = darkMode ? palette.white : palette.gray.dark1;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <path
        d="M5 7.71429C5 6.77143 5.7875 6 6.75 6H9.55C9.9875 6 10.425 6.17143 10.775 6.51429L12 7.71429H17.25C18.2125 7.71429 19 8.48571 19 9.42857V16.2857C19 17.2286 18.2125 18 17.25 18H6.75C5.7875 18 5 17.2286 5 16.2857V7.71429Z"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 11.0002H19"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

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
  if (item.type === 'folder') {
    return <FolderIcon />;
  }
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
