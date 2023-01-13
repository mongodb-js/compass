import React from 'react';
import { css, cx, spacing, palette } from '@mongodb-js/compass-components';

const buttonStyles = css({
  borderRadius: spacing[1],
  cursor: 'pointer',
  marginBottom: spacing[1],
  background: 'none',
  border: 'none',
  width: '100%',
  padding: spacing[2],
  textAlign: 'left',
  fontWeight: 500,
});

const hoverStyles = css({
  '&:hover,&:focus': {
    backgroundColor: palette.green.light2,
    color: palette.gray.dark3,
  },
});

const activeStyles = css({
  backgroundColor: palette.green.light3,
  color: palette.gray.dark3,
  '&:active,&:focus': {
    backgroundColor: palette.green.light3,
    color: palette.gray.dark3,
  },
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
    <div
      data-testid="settings-modal-sidebar"
      role="tablist"
      aria-labelledby="modal-title"
    >
      {items.map((item) => (
        <button
          type="button"
          key={item}
          role="tab"
          aria-controls={`${item} Section`}
          aria-selected={activeItem === item}
          className={cx(buttonStyles, {
            [hoverStyles]: item !== activeItem,
            [activeStyles]: item === activeItem,
          })}
          id={`${item} Tab`}
          data-testid={`sidebar-${item}-item`}
          onClick={() => onSelectItem(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
};

export default SettingsSideNav;
