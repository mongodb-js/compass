import React, { useState, useCallback } from 'react';
import { Menu, MenuItem, Button, Icon } from '@mongodb-js/compass-components';

export type PipelineOutputOption = 'expand' | 'collapse';

export const PipelineOutputOptionsMenu: React.FunctionComponent<{
  option: PipelineOutputOption;
  onChangeOption: (option: PipelineOutputOption) => void;
}> = ({ option, onChangeOption }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const onMenuItemClick = useCallback(
    (evt) => {
      const newOption = evt.currentTarget.dataset
        .action as PipelineOutputOption;
      evt.stopPropagation();
      setIsMenuOpen(false);
      onChangeOption(newOption);
    },
    [onChangeOption]
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
        active={option === 'expand'}
        data-action="expand"
        onClick={onMenuItemClick}
        aria-label="Expand all fields"
      >
        Expand all fields
      </MenuItem>
      <MenuItem
        active={option === 'collapse'}
        data-action="collapse"
        onClick={onMenuItemClick}
        aria-label="Collapse all fields"
      >
        Collapse all fields
      </MenuItem>
    </Menu>
  );
};
