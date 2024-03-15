import { Icon, IconButton, Subtitle } from '@mongodb-js/compass-components';
import { ConnectionInfo, css } from '@mongodb-js/connection-info';
import React from 'react';
import { useActiveConnections } from '@mongodb-js/compass-connections/provider';

const openConnectionListHeaderStyles = css({
  flexGrow: 0,
  display: 'flex',
  flexDirection: 'row',
  alignContent: 'center',
  justifyContent: 'space-between',
});

const openConnectionListHeaderTitleStyles = css({
  marginTop: 0,
  marginBottom: 0,
  textTransform: 'uppercase',
  fontSize: '12px',
});

const openConnectionCountStyles = css({
  fontWeight: 'normal',
});

export function OpenConnectionList(): React.ReactElement {
  const openConnections = useActiveConnections();
  const connectionsCount = openConnections.length;
  return (
    <div>
      <header className={openConnectionListHeaderStyles}>
        <Subtitle className={openConnectionListHeaderTitleStyles}>
          Active connections{' '}
          <span className={openConnectionCountStyles}>
            ({connectionsCount})
          </span>
        </Subtitle>
        <div>
          <IconButton
            aria-label="New Connection"
            title="New Connection"
            data-testid="new-connection-button"
          >
            TODO: collapse icon & behaviour
          </IconButton>
        </div>
      </header>
    </div>
  );
}
