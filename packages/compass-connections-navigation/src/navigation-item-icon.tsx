import React from 'react';
import type { SidebarTreeItem } from './tree-data';
import { css, Icon, ServerIcon, Tooltip } from '@mongodb-js/compass-components';
import type { GlyphName } from '@mongodb-js/compass-components';
import { WithStatusMarker } from './with-status-marker';
import { isLocalhost } from 'mongodb-build-info';

const UNPROVISIONED_NAMESPACE_TEXT =
  'You have privileges to this namespace, but it is not in your list of current namespaces';

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
    if (item.ns_source === 'provisioned') {
      return <Icon glyph="Database" />;
    }
    return (
      <IconWithTooltip
        text={UNPROVISIONED_NAMESPACE_TEXT}
        glyph="EmptyDatabase"
      />
    );
  }
  if (item.type === 'collection') {
    if (item.ns_source === 'provisioned') {
      return <Icon glyph="Collection" />;
    }
    return (
      <IconWithTooltip
        text={UNPROVISIONED_NAMESPACE_TEXT}
        glyph="EmptyFolder"
      />
    );
  }
  if (item.type === 'view') {
    return <Icon glyph="Visibility" />;
  }
  if (item.type === 'timeseries') {
    return <Icon glyph="TimeSeries" />;
  }
  if (item.type === 'connection') {
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
