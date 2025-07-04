import React from 'react';
import {
  Icon,
  Button,
  Tooltip,
  WorkspaceContainer,
  css,
} from '@mongodb-js/compass-components';
import { DOCUMENT_NARROW_ICON_BREAKPOINT } from '../constants/document-narrow-icon-breakpoint';

type DeleteMenuButtonProps = {
  isWritable: boolean;
  onClick: () => void;
};

const hiddenOnNarrowStyles = css({
  [`@container ${WorkspaceContainer.toolbarContainerQueryName} (width < ${DOCUMENT_NARROW_ICON_BREAKPOINT})`]:
    {
      display: 'none',
    },
});

const DeleteMenuButton: React.FunctionComponent<DeleteMenuButtonProps> = ({
  isWritable,
  onClick,
}) => {
  return (
    <Button
      disabled={!isWritable}
      value={'Delete'}
      size="xsmall"
      onClick={onClick}
      leftGlyph={<Icon glyph="Trash"></Icon>}
      data-testid="crud-bulk-delete"
      title="Delete"
    >
      <span className={hiddenOnNarrowStyles}>Delete</span>
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
      enabled={!isWritable}
      justify="middle"
    >
      {disabledTooltip}
    </Tooltip>
  );
};

export default DeleteMenu;
