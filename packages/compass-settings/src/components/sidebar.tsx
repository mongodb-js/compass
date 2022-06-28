import React from 'react';

import { css, cx, spacing, uiColors } from '@mongodb-js/compass-components';

const navItemStyles = css({
  padding: spacing[2],
  borderRadius: spacing[1],
  cursor: 'pointer',
  marginTop: spacing[1],
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
      <ul>
        {items.map((item) => (
          <li
            className={cx(navItemStyles, {
              [activeItemStyles]: item === activeItem,
            })}
            key={item}
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
