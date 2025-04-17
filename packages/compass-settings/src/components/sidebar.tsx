import React from 'react';
import {
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { SettingsTabId } from '../stores/settings';

const buttonStyles = css({
  borderRadius: spacing[100],
  cursor: 'pointer',
  marginBottom: spacing[100],
  background: 'none',
  border: 'none',
  width: '100%',
  padding: spacing[200],
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
  activeItem: SettingsTabId;
  onSelectItem: (item: SettingsTabId) => void;
  items: [SettingsTabId, string][];
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
      {items.map(([tabId, name]) => (
        <button
          type="button"
          key={tabId}
          role="tab"
          aria-controls={`${tabId}-section`}
          aria-selected={activeItem === tabId}
          className={cx(buttonStyles, {
            [darkMode ? hoverStylesDark : hoverStylesLight]:
              tabId !== activeItem,
            [darkMode ? activeStylesDark : activeStylesLight]:
              tabId === activeItem,
          })}
          id={`${tabId}-tab`}
          data-testid={`sidebar-${tabId}-item`}
          onClick={() => onSelectItem(tabId)}
        >
          {name}
        </button>
      ))}
    </div>
  );
};

export default SettingsSideNav;
