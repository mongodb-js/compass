import React, { useState, useEffect } from 'react';
import {
  css,
  Icon,
  MenuItem,
  SplitButton,
  type GlyphName,
  type ItemComponentProps,
  type MenuItemProps,
} from '@mongodb-js/compass-components';
import type { Actions } from './constants';

const menuItemStyles = css({
  minWidth: 'max-content',
});

type ConnectMenuItemProps = {
  action: Actions;
  glyph: GlyphName;
} & Omit<MenuItemProps, 'glyph'>;

function ConnectMenuItem({ action, glyph, ...rest }: ConnectMenuItemProps) {
  return (
    <MenuItem
      data-action={action}
      className={menuItemStyles}
      glyph={<Icon glyph={glyph} />}
      {...rest}
    />
  );
}

// Hack to make SplitButton consider this as a MenuItem
ConnectMenuItem.displayName = 'MenuItem';

export function ConnectButtonWithMenu({
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
}: ItemComponentProps<Actions>) {
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
      triggerAriaLabel="see more connection options"
      menuItems={[
        <ConnectMenuItem
          key="connection-connect"
          action="connection-connect"
          glyph="Connect"
          onClick={onClick}
        >
          Connect Here
        </ConnectMenuItem>,
        <ConnectMenuItem
          key="connection-connect-in-new-window"
          action="connection-connect-in-new-window"
          glyph="OpenNewTab"
          onClick={onClick}
        >
          Connect in a New Window
        </ConnectMenuItem>,
      ]}
    >
      {label}
    </SplitButton>
  );
}
