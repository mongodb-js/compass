/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {
  css,
  Icon,
  useFocusRing,
  mergeProps,
  uiColors,
} from '@mongodb-js/compass-components';

const items = [
  { icon: 'CurlyBraces', label: 'My Queries', tabName: 'My Queries' },
  { icon: 'Database', label: 'Databases', tabName: 'Databases' },
];

const navList = css({
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

const navItemButton = css({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  margin: 0,
  padding: 0,
  background: 'none',
  border: 'none',
  backgroundColor: uiColors.gray.dark2,
  ':hover': {
    cursor: 'pointer',
    backgroundColor: uiColors.gray.dark3,
  },
});

const iconStyle = css({
  // Not using spacing to match with non-leafygreen styles of the sidebar
  padding: 10,
  boxSizing: 'content-box',
  fontSize: 0,
});

const hiddenLabel = css({
  display: 'none',
});

const NavigationItem = ({ label, icon, onItemClick, isExpanded }) => {
  const focusRingProps = useFocusRing();
  const buttonProps = mergeProps(
    {
      type: 'button',
      'aria-label': `Open "${label}" tab`,
      title: label,
      onClick: onItemClick,
      className: navItemButton,
    },
    focusRingProps
  );

  return (
    <button {...buttonProps}>
      <Icon title={null} glyph={icon} className={iconStyle} />
      <span className={!isExpanded ? hiddenLabel : undefined}>{label}</span>
    </button>
  );
};

NavigationItem.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.string,
  onItemClick: PropTypes.func,
  isExpanded: PropTypes.bool,
};

export const NavigationItems = ({ onItemClick, isExpanded }) => {
  return (
    <nav>
      <ul className={navList}>
        {items.map((item, index) => {
          return (
            <NavigationItem
              key={`${index}-${item.tabName}`}
              label={item.label}
              icon={item.icon}
              onItemClick={() => onItemClick(item.tabName)}
              isExpanded={isExpanded}
            />
          );
        })}
      </ul>
    </nav>
  );
};

NavigationItems.propTypes = {
  onItemClick: PropTypes.func,
  isExpanded: PropTypes.bool,
};
