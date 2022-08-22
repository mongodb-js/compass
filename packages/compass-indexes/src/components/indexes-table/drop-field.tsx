import React from 'react';
import { IconButton, Icon } from '@mongodb-js/compass-components';

type DropFieldProps = {
  name: string;
  onDelete: () => void;
};

const DropField: React.FunctionComponent<DropFieldProps> = ({
  name,
  onDelete,
}) => {
  return (
    <IconButton
      aria-label={`Drop Index ${name}`}
      onClick={onDelete}
      data-testid="drop-index-button"
    >
      <Icon glyph="Trash" />
    </IconButton>
  );
};

export default DropField;
