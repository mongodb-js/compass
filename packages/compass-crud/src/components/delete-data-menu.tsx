import React from 'react';
import { Icon, Button } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model';

type DeleteMenuButtonProps = {
  isWritable: boolean;
  onClick: () => void;
};

const DeleteMenuButton: React.FunctionComponent<DeleteMenuButtonProps> = ({
  isWritable,
  onClick,
}) => {
  const isVisible = usePreference('enableBulkDeleteOperations', React);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      disabled={!isWritable}
      value={'Delete'}
      size="xsmall"
      onClick={onClick}
      leftGlyph={<Icon glyph="Trash"></Icon>}
      data-testid="crud-bulk-delete"
    >
      Delete
    </Button>
  );
};

const DeleteMenu: React.FunctionComponent<DeleteMenuButtonProps> = ({
  isWritable,
  onClick,
}) => {
  return (
    <DeleteMenuButton
      isWritable={isWritable}
      onClick={onClick}
    ></DeleteMenuButton>
  );
};

export default DeleteMenu;
