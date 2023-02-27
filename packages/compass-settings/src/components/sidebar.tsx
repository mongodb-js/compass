import React from 'react';
import {
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';

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

const hoverStylesLight = css({
  '&:hover,&:focus': {
    backgroundColor: palette.green.light2,
    color: palette.gray.dark3,
  },
});

const activeStylesLight = css({
  backgroundColor: palette.green.light3,
  color: palette.gray.dark3,
  '&:active,&:focus': {
    backgroundColor: palette.green.light3,
    color: palette.gray.dark3,
  },
});

const hoverStylesDark = css({
  '&:hover,&:focus': {
    backgroundColor: palette.gray.dark3,
    color: palette.white,
  },
});

const activeStylesDark = css({
  backgroundColor: palette.gray.dark2,
  color: palette.white,
  '&:active,&:focus': {
    backgroundColor: palette.gray.dark2,
    color: palette.white,
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
  const darkMode = useDarkMode();
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
            [darkMode ? hoverStylesDark : hoverStylesLight]:
              item !== activeItem,
            [darkMode ? activeStylesDark : activeStylesLight]:
              item === activeItem,
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
