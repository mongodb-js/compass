import React, { useCallback } from 'react';
import {
  Tooltip,
  DropdownMenuButton,
  css,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { MenuAction } from '@mongodb-js/compass-components';
import { DOCUMENT_NARROW_ICON_BREAKPOINT } from '../constants/document-narrow-icon-breakpoint';

const tooltipContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const bulkActionsMenuButtonStyles = css({
  whiteSpace: 'nowrap',
});

type BulkActionOption = 'bulk-update' | 'bulk-delete';

const bulkActions: MenuAction<BulkActionOption>[] = [
  { action: 'bulk-update', label: 'Bulk update documents' },
  { action: 'bulk-delete', label: 'Bulk delete documents' },
];

type BulkActionsMenuButtonProps = {
  disabled?: boolean;
  onUpdate: () => void;
  onDelete: () => void;
};

function BulkActionsIcon() {
  const darkMode = useDarkMode();
  const fill = darkMode ? palette.gray.light2 : palette.gray.base;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M12.4121 5.05859C12.8018 5.05876 13.1181 5.37493 13.1182 5.76465V11.4121C13.118 12.8414 11.9586 14 10.5293 14H5.82324C5.43354 13.9998 5.11816 13.6837 5.11816 13.2939C5.11826 12.9043 5.4336 12.5881 5.82324 12.5879H10.5293C11.1789 12.5879 11.7059 12.0617 11.7061 11.4121V5.76465C11.7061 5.37483 12.0223 5.05859 12.4121 5.05859ZM8.92871 2C9.74731 2 10.4111 2.66382 10.4111 3.48242V9.88672C10.4111 10.7053 9.74731 11.3691 8.92871 11.3691H4.48242C3.66382 11.3691 3 10.7053 3 9.88672V6.44629H6.33496C6.94891 6.44629 7.44629 5.94891 7.44629 5.33496V2H8.92871ZM6.58203 4.84082C6.58203 5.25012 6.25012 5.58203 5.84082 5.58203H3V4.90039C3.00012 4.7041 3.07805 4.51581 3.2168 4.37695L5.37695 2.2168C5.51581 2.07805 5.7041 2.00012 5.90039 2H6.58203V4.84082Z"
        fill={fill}
      />
    </svg>
  );
}

function BulkActionsMenuButton({
  disabled = false,
  onUpdate,
  onDelete,
}: BulkActionsMenuButtonProps) {
  const onAction = useCallback(
    (action: BulkActionOption) => {
      if (action === 'bulk-update') {
        onUpdate();
      } else {
        onDelete();
      }
    },
    [onUpdate, onDelete]
  );

  return (
    <DropdownMenuButton<BulkActionOption>
      data-testid="crud-bulk-actions"
      actions={bulkActions}
      onAction={onAction}
      buttonText="Bulk"
      buttonProps={{
        size: 'xsmall',
        leftGlyph: <BulkActionsIcon />,
        disabled,
        className: bulkActionsMenuButtonStyles,
      }}
      narrowBreakpoint={DOCUMENT_NARROW_ICON_BREAKPOINT}
    />
  );
}

type BulkActionsMenuProps = BulkActionsMenuButtonProps & {
  isWritable: boolean;
  disabledTooltip: string;
};

const BulkActionsMenu: React.FunctionComponent<BulkActionsMenuProps> = ({
  isWritable,
  disabledTooltip,
  onUpdate,
  onDelete,
}) => {
  if (isWritable) {
    return <BulkActionsMenuButton onUpdate={onUpdate} onDelete={onDelete} />;
  }

  return (
    <Tooltip
      trigger={({
        children: tooltipChildren,
        ...tooltipTriggerProps
      }: React.HTMLProps<HTMLInputElement>) => (
        <div className={tooltipContainerStyles} {...tooltipTriggerProps}>
          <BulkActionsMenuButton
            disabled
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
          {tooltipChildren}
        </div>
      )}
      // When we're not writable we show the button as disabled with
      // a tooltip explaining why.
      enabled={!isWritable}
      justify="middle"
    >
      {disabledTooltip}
    </Tooltip>
  );
};

export { BulkActionsMenu };
