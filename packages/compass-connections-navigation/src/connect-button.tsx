import React, { useState, useEffect } from 'react';
import {
  css,
  Icon,
  MenuItem,
  SplitButton,
  type ItemComponentProps,
} from '@mongodb-js/compass-components';
import type { Actions } from './constants';

const menuItemStyles = css({
  width: 'max-content',
});

type ConnectButtonProps = ItemComponentProps<Actions>;

export function ConnectButton({
  setHidable,
  action,
  tooltip,
  label,
  iconSize,
  iconStyle,
  isDisabled,
  onClick,
  className,
  'data-testid': testId,
}: ConnectButtonProps) {
  const [isOpen, setOpen] = useState(false);

  // Opening the menu should keep it visible
  useEffect(() => {
    if (setHidable) {
      setHidable(!isOpen);
    }
  }, [setHidable, isOpen]);

  return (
    <SplitButton
      key={action}
      title={!tooltip ? label : undefined}
      label={label}
      size={iconSize}
      data-action={action}
      data-testid={testId}
      onClick={onClick}
      className={className}
      style={iconStyle}
      disabled={isDisabled}
      renderDarkMenu={false}
      darkMode={false}
      open={isOpen}
      setOpen={setOpen}
      menuItems={[
        <MenuItem key="connect-here" glyph={<Icon glyph="Connect" />}>
          Connect Here
        </MenuItem>,
        <MenuItem
          key="connect-in-new-window"
          className={menuItemStyles}
          glyph={<Icon glyph="OpenNewTab" />}
        >
          Connect in a New Window
        </MenuItem>,
      ]}
    >
      {label}
    </SplitButton>
  );
}
