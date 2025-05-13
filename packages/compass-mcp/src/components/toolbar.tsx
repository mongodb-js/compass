import React from 'react';
import {
  css,
  Icon,
  Select,
  spacing,
  Subtitle,
  Option,
} from '@mongodb-js/compass-components';
import { useConnectionsList } from '@mongodb-js/compass-connections/provider';
import { connectionSelected } from '../store/connections';
import { connect } from 'react-redux';
import type { MCPStoreRootState } from '../store/reducer';

const toolbarStyles = css({
  display: 'flex',
  padding: spacing[400],
  justifyContent: 'center',
  alignItems: 'center',
  gap: spacing[200],
});

const selectStyles = css({
  width: '200px',
});

type MCPToolbarProps = {
  selectedConnectionId: string | null;
  isConnecting: boolean;
  connectionError: Error | null;
  onConnectionSelect: (connId: string) => void;
};

function MCPToolbar({
  selectedConnectionId,
  isConnecting,
  connectionError,
  onConnectionSelect,
}: MCPToolbarProps) {
  const connections = useConnectionsList();

  return (
    <div className={toolbarStyles}>
      <Icon glyph="Sparkle" />
      <Subtitle>Compass AI Assistant</Subtitle>
      <Select
        label=""
        aria-label="Select connection"
        value={selectedConnectionId ?? ''}
        data-testid="new-diagram-connection-selector"
        onChange={onConnectionSelect}
        disabled={connections.length === 0 || isConnecting}
        errorMessage={connectionError ? connectionError.message : undefined}
        className={selectStyles}
      >
        {connections.map((connection) => {
          return (
            <Option key={connection.info.id} value={connection.info.id}>
              {connection.title}
            </Option>
          );
        })}
      </Select>
    </div>
  );
}

const mapState = ({ connections }: MCPStoreRootState) => ({
  selectedConnectionId: connections.selectedConnectionId,
  isConnecting: connections.isConnecting,
  connectionError: connections.connectionError,
});

const mapDispatch = {
  onConnectionSelect: connectionSelected,
};

export default connect(mapState, mapDispatch)(MCPToolbar);
