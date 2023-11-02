import React from 'react';
import { Icon, Button, Tooltip } from '@mongodb-js/compass-components';
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

type DeleteMenuProps = DeleteMenuButtonProps & {
  disabledTooltip: string;
};

const DeleteMenu: React.FunctionComponent<DeleteMenuProps> = ({
  isWritable,
  onClick,
  disabledTooltip,
}) => {
  if (isWritable) {
    return (
      <DeleteMenuButton isWritable={true} onClick={onClick}></DeleteMenuButton>
    );
  }

  return (
    <Tooltip
      trigger={({
        children: tooltipChildren,
        ...tooltipTriggerProps
      }: React.HTMLProps<HTMLInputElement>) => (
        <div {...tooltipTriggerProps}>
          <DeleteMenuButton onClick={onClick} isWritable={false} />
          {tooltipChildren}
        </div>
      )}
      // Disable the tooltip when the instance is in a writable state.
      isDisabled={isWritable}
      justify="middle"
      delay={500}
    >
      {disabledTooltip}
    </Tooltip>
  );
};

export default DeleteMenu;
