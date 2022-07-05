import React from 'react';

import { css, cx, spacing, uiColors } from '@mongodb-js/compass-components';

const itemStyles = css({
  borderRadius: spacing[1],
  cursor: 'pointer',
  marginBottom: spacing[1],
  background: 'none',
  border: 'none',
  width: '100%',
  padding: spacing[2],
  textAlign: 'left',
});

const itemHoverStyles = css({
  '&:hover': {
    backgroundColor: uiColors.green.light2,
  },
});

const itemActiveStyles = css({
  backgroundColor: uiColors.green.light3,
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
    <nav data-testid="settings-sidebar">
      <ul role="tablist">
        {items.map((item) => (
          <li role="tab" key={item}>
            <button
              className={cx(itemStyles, {
                [itemHoverStyles]: item !== activeItem,
                [itemActiveStyles]: item === activeItem,
              })}
              data-testid={`sidebar-${item}-item`}
              onClick={() => onSelectItem(item)}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SettingsSideNav;
