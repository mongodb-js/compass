import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const FA_ICONS = {
  remove: 'times-circle',
  revert: 'rotate-left',
  collapsed: 'angle-right',
  expanded: 'angle-right  fa-rotate-90',
  addChild: 'level-down fa-rotate-90',
  addSibling: 'plus-square-o',
};

const faIcon = css({
  width: spacing[3],
  height: spacing[3],
  padding: '2px',
  textAlign: 'center',
});

export const FontAwesomeIcon: React.FunctionComponent<{
  icon: keyof typeof FA_ICONS;
}> = ({ icon }) => {
  const faClassName = FA_ICONS[icon];
  return (
    <span
      role="presentation"
      className={cx(faIcon, `fa fa-${faClassName}`)}
    ></span>
  );
};
