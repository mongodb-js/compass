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

type AddDataMenuProps = {
  instanceDescription: string;
  insertDataHandler: (openInsertKey: 'insert-document' | 'import-file') => void;
  isWritable: boolean;
};

const AddDataMenu: React.FunctionComponent<AddDataMenuProps> = ({
  instanceDescription,
  insertDataHandler,
  isWritable,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Menu
      open={isOpen}
      setOpen={setIsOpen}
      justify="start"
      className={menuStyles}
      trigger={({
        children,
        onClick,
        ...menuProps
      }: Omit<React.HTMLProps<HTMLButtonElement>, 'type'>) => {
        return (
          <>
            <Tooltip
              trigger={({
                className,
                children,
                ...tooltipTriggerProps
              }: React.HTMLProps<HTMLInputElement>) => {
                return (
                  <div className={className} {...tooltipTriggerProps}>
                    <Button
                      leftGlyph={<Icon glyph="Download" />}
                      rightGlyph={<Icon glyph="CaretDown" />}
                      variant="primary"
                      disabled={!isWritable}
                      data-testid="crud-add-data-button"
                      size="xsmall"
                      onClick={onClick}
                      {...menuProps}
                    >
                      Add Data
                    </Button>
                    {children}
                  </div>
                );
              }}
              // Disable the tooltip when the instance is in a writable state.
              isDisabled={isWritable}
              justify="middle"
              delay={500}
              darkMode
            >
              {instanceDescription}
            </Tooltip>
            {children}
          </>
        );
      }}
    >
      <MenuItem
        data-testid="hadron-document-add-child"
        onClick={() => {
          setIsOpen(false);
          insertDataHandler('import-file');
        }}
      >
        Import File
      </MenuItem>
      <MenuItem
        data-testid="hadron-document-add-sibling"
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
