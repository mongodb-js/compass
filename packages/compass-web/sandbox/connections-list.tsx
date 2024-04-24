import React from 'react';
import {
  css,
  spacing,
  palette,
  KeylineCard,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/main';

const historyListStyles = css({
  all: 'unset',
  marginTop: spacing[1],
  display: 'grid',
  gridTemplateColumns: '100%',
  gridAutoRows: 'auto',
  gap: spacing[2],
});

const historyListItemStyles = css({
  listStyle: 'none',
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
});

const historyItemButtonStyles = css({
  all: 'unset',
  display: 'block',
  width: '100%',
  cursor: 'pointer',
  color: palette.black,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export function ConnectionsList({
  connections,
  onConnectionClick,
  onConnectionDoubleClick,
  renderConnectionLabel,
  ...props
}: {
  connections: ConnectionInfo[];
  onConnectionClick(connectionInfo: ConnectionInfo): void;
  onConnectionDoubleClick(connectionInfo: ConnectionInfo): void;
  renderConnectionLabel(connectionInfo: ConnectionInfo): React.ReactNode;
} & React.HTMLProps<HTMLUListElement>) {
  return (
    <ul {...props} className={historyListStyles}>
      {connections.map((connectionInfo) => {
        return (
          <KeylineCard
            as="li"
            key={connectionInfo.id}
            className={historyListItemStyles}
            contentStyle="clickable"
          >
            <button
              type="button"
              className={historyItemButtonStyles}
              onDoubleClick={() => {
                onConnectionDoubleClick(connectionInfo);
              }}
              onClick={() => {
                onConnectionClick(connectionInfo);
              }}
            >
              {renderConnectionLabel(connectionInfo)}
            </button>
          </KeylineCard>
        );
      })}
    </ul>
  );
}
