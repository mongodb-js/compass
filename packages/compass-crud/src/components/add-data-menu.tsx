import React, { useState } from 'react';
import {
  Button,
  Icon,
  Menu,
  MenuItem,
  css,
} from '@mongodb-js/compass-components';

const menuStyles = css({
  width: 'auto',
});

type AddDataMenuProps = {
  insertDataHandler: (openInsertKey: 'insert-document' | 'import-file') => void;
};

const AddDataMenu: React.FunctionComponent<AddDataMenuProps> = ({
  insertDataHandler
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
        ...props
      }: Omit<React.HTMLProps<HTMLButtonElement>, 'type'>) => {
        return (
          <>
            <Button
              leftGlyph={<Icon glyph="Download" />}
              rightGlyph={<Icon glyph="CaretDown" />}
              variant="primary"
              size="xsmall"
              onClick={onClick}
              {...props}
            >
              Add Data
            </Button>
            {children}
          </>
        );
      }}
    >
      {/* TODO: This needs to be behind an is-writable check */}
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
}

export {
  AddDataMenu
};
