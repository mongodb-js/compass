import React from 'react';
import { cx, css } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { transparentize } from 'polished';

const outerShadowContainerStyle = css({
  height: '100%',
  width: '100%',
  '::before': {
    content: '""',
    position: 'sticky',
    top: 0,
    display: 'block',
    width: '100%',
    height: spacing[2],
    background: `linear-gradient(${uiColors.black} 0%, ${transparentize(
      50,
      uiColors.black
    )} 100%)`,
    overflow: 'auto',
  },
  '::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    display: 'block',
    width: '100%',
    height: spacing[2],
    background: uiColors.white,
  },
});

function ScrollBox({
  children,
  className,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx(className, outerShadowContainerStyle)}>{children}</div>
  );
}

export { ScrollBox };
