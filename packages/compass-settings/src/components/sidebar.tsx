import React from 'react';

import { css, cx, spacing, uiColors } from '@mongodb-js/compass-components';

const navItemStyles = css({
  padding: spacing[2],
  borderRadius: spacing[1],
  cursor: 'pointer',
  marginBottom: spacing[1],
  '&:hover': {
    backgroundColor: uiColors.yellow.base,
  },
});

const activeItemStyles = css({
  backgroundColor: uiColors.yellow.base,
});

type SidebarProps = {
  activeItem: string;
  onSelectItem: (item: string) => void;
  items: string[];
};

const SettingsSideNav: React.FunctionComponent<SidebarProps> = ({
  activeItem,
  items,
  onSelectItem,
}) => {
  return (
    <nav>
      <ul role="menu">
        {items.map((item) => (
          <li
            data-testid="settings-sidebar-item"
            role="menuitem"
            tabIndex={0}
            className={cx(navItemStyles, {
              [activeItemStyles]: item === activeItem,
            })}
            key={item}
            onKeyDown={({ key }) => {
              if (key === 'Enter') {
                onSelectItem(item);
              }
            }}
            onClick={() => onSelectItem(item)}
          >
            {item}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SettingsSideNav;
