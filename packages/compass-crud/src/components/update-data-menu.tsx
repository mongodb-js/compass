import React from 'react';
import { Icon, Button, Tooltip } from '@mongodb-js/compass-components';
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

type UpdateMenuProps = UpdateMenuButtonProps & {
  disabledTooltip: string;
};

const UpdateMenu: React.FunctionComponent<UpdateMenuProps> = ({
  isWritable,
  onClick,
  disabledTooltip,
}) => {
  if (isWritable) {
    return (
      <UpdateMenuButton isWritable={true} onClick={onClick}></UpdateMenuButton>
    );
  }

  return (
    <Tooltip
      trigger={({
        children: tooltipChildren,
        ...tooltipTriggerProps
      }: React.HTMLProps<HTMLInputElement>) => (
        <div {...tooltipTriggerProps}>
          <UpdateMenuButton onClick={onClick} isWritable={false} />
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

export default UpdateMenu;
