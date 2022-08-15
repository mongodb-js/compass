import React, { useState } from 'react';
import {
  Button,
  Icon,
  Menu,
  MenuItem,
  Tooltip,
  css,
} from '@mongodb-js/compass-components';

const menuStyles = css({
  width: 'auto',
});

const tooltipContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const addDataButtonStyles = css({
  whiteSpace: 'nowrap',
});

type AddDataMenuProps = {
  instanceDescription: string;
  insertDataHandler: (openInsertKey: 'insert-document' | 'import-file') => void;
  isWritable: boolean;
};

function AddDataButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <Button
      className={addDataButtonStyles}
      size="xsmall"
      leftGlyph={<Icon glyph="Download" />}
      rightGlyph={<Icon glyph="CaretDown" />}
      disabled={disabled}
      variant="primary"
      title="Add Data"
      aria-label="Add Data"
      data-testid="crud-add-data-button"
      onClick={onClick}
    >
      Add Data
    </Button>
  );
}

const AddDataMenu: React.FunctionComponent<AddDataMenuProps> = ({
  instanceDescription,
  insertDataHandler,
  isWritable,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isWritable) {
    // When we're not writable return a disabled button with the instance
    // description as a tooltip.
    return (
      <Tooltip
        trigger={({
          children: tooltipChildren,
          ...tooltipTriggerProps
        }: React.HTMLProps<HTMLInputElement>) => (
          <div className={tooltipContainerStyles} {...tooltipTriggerProps}>
            <AddDataButton
              disabled
              onClick={() => {
                /* no-op as it's disabled. */
              }}
            />
            {tooltipChildren}
          </div>
        )}
        // Disable the tooltip when the instance is in a writable state.
        isDisabled={isWritable}
        justify="middle"
        delay={500}
        darkMode
      >
        {instanceDescription}
      </Tooltip>
    );
  }

  return (
    <Menu
      open={isOpen}
      setOpen={setIsOpen}
      justify="start"
      className={menuStyles}
      trigger={({
        onClick,
        children,
      }: {
        onClick(): void;
        children: React.ReactChildren;
      }) => (
        <>
          <AddDataButton onClick={() => onClick()} />
          {children}
        </>
      )}
    >
      <MenuItem
        data-testid="crud-add-data-import-file"
        onClick={() => {
          setIsOpen(false);
          insertDataHandler('import-file');
        }}
      >
        Import File
      </MenuItem>
      <MenuItem
        data-testid="crud-add-data-insert-document"
        onClick={() => {
          setIsOpen(false);
          insertDataHandler('insert-document');
        }}
      >
        Insert Document
      </MenuItem>
    </Menu>
  );
};

export { AddDataMenu };
