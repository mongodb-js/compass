import React from 'react';
import { Icon, Button } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model';

type UpdateMenuButtonProps = {
  isWritable: boolean;
  onClick: () => void;
};

const UpdateMenuButton: React.FunctionComponent<UpdateMenuButtonProps> = ({
  isWritable,
  onClick,
}) => {
  const isVisible = usePreference('enableBulkUpdateOperations', React);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      disabled={!isWritable}
      value="Update"
      size="xsmall"
      onClick={onClick}
      leftGlyph={<Icon glyph="Edit"></Icon>}
      data-testid="crud-update"
    >
      Update
    </Button>
  );
};

const UpdateMenu: React.FunctionComponent<UpdateMenuButtonProps> = ({
  isWritable,
  onClick,
}) => {
  return (
    <UpdateMenuButton
      isWritable={isWritable}
      onClick={onClick}
    ></UpdateMenuButton>
  );
};

export default UpdateMenu;
