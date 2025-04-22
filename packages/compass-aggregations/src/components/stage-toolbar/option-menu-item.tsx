import React from 'react';

import {
  css,
  Icon,
  MenuItem,
  palette,
  spacing,
  type GlyphName,
} from '@mongodb-js/compass-components';

const styles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

type OptionMenuItemProps = {
  label: string;
  icon: GlyphName;
  onClick: () => void;
  setMenuOpen: (open: boolean) => void;
};

export function OptionMenuItem({
  label,
  onClick,
  setMenuOpen,
  icon,
}: OptionMenuItemProps) {
  return (
    <MenuItem
      data-text={label}
      onClick={() => {
        setMenuOpen(false);
        onClick();
      }}
    >
      <div className={styles}>
        <Icon color={palette.gray.dark2} glyph={icon} size="small" />
        {label}
      </div>
    </MenuItem>
  );
}
