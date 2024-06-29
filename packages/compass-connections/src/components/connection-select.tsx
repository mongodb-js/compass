import React, { useCallback } from 'react';
import { Select, Option, css } from '@mongodb-js/compass-components';
import {
  useConnectionColor,
  ColorCircleGlyph,
} from '@mongodb-js/connection-form';

const selectStyles = css({
  // Working around leafygreen Select issues
  // See https://jira.mongodb.org/browse/PD-1677 and https://jira.mongodb.org/browse/PD-1764
  button: {
    zIndex: 999,
  },
});

export type ConnectionSelectProps = {
  selectedConnectionId: string;
  connections: { id: string; name: string; color?: string }[];
  onConnectionSelected(connectionId: string): void;
};

export const ConnectionSelect: React.FC<ConnectionSelectProps> = ({
  selectedConnectionId,
  connections,
  onConnectionSelected,
}) => {
  const { connectionColorToHex } = useConnectionColor();
  const handleChange = useCallback(
    (connectionId: string) => {
      onConnectionSelected(connectionId);
    },
    [onConnectionSelected]
  );
  return (
    <Select
      name="connection"
      label="Connection"
      value={selectedConnectionId}
      onChange={handleChange}
      usePortal={false}
      className={selectStyles}
      dropdownWidthBasis="option"
      data-testid="connection-select"
    >
      {connections.map(({ id, name, color }) => {
        const glyph =
          color && color !== 'no-color' ? (
            <ColorCircleGlyph hexColor={connectionColorToHex(color)} />
          ) : undefined;
        return (
          <Option key={id} value={id} glyph={glyph}>
            {name}
          </Option>
        );
      })}
    </Select>
  );
};
