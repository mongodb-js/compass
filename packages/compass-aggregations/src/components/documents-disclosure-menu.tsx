import React, { useState, useCallback } from 'react';
import {
  Menu,
  MenuItem,
  Button,
  Icon,
} from '@mongodb-js/compass-components';

export type DocumentsDisclosureOption = 'expanded' | 'collapsed';

export const DocumentsDisclosureMenu: React.FunctionComponent<{
  onChange: (option: DocumentsDisclosureOption) => void;
}> = ({
  onChange
}) => {
  const [option, setOption] = useState<DocumentsDisclosureOption>("collapsed");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const onMenuItemClick = useCallback(
    (evt) => {
      const newOption = evt.currentTarget.dataset.action as DocumentsDisclosureOption;
      evt.stopPropagation();
      setIsMenuOpen(false);
      setOption(newOption);
      onChange(newOption);
    },
    [setOption, onChange]
  );
  return (
    <Menu
      open={isMenuOpen}
      setOpen={setIsMenuOpen}
      align="bottom"
      justify="start"
      trigger={
        <Button size="xsmall" aria-label="Output Options">
          Output Options <Icon glyph="CaretDown" />
        </Button>
      }
    >
      <MenuItem
        active={option === 'expanded'}
        data-action="expanded"
        onClick={onMenuItemClick}
        aria-label="Expand all fields"
        >
        Expand all fields
      </MenuItem>
      <MenuItem
        active={option === 'collapsed'}
        data-action="collapsed"
        onClick={onMenuItemClick}
        aria-label="Collapse all fields"
        >
        Collapse all fields
      </MenuItem>
    </Menu>
  );
};