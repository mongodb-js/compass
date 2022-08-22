import React from 'react';
import { IconButton, Icon } from '@mongodb-js/compass-components';

type DropFieldProps = {
  darkMode?: boolean;
  name: string;
  onDelete: () => void;
};

const DropField: React.FunctionComponent<DropFieldProps> = ({
  darkMode,
  name,
  onDelete,
}) => {
  return (
    <IconButton
      darkMode={darkMode}
      aria-label={`Drop Index ${name}`}
      onClick={onDelete}
      data-testid="drop-index-button"
    >
      <Icon glyph="Trash" />
    </IconButton>
  );
};

export default DropField;
