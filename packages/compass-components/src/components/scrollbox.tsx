import React from 'react';
import { cx, css } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { transparentize } from 'polished';

const scrollboxStyles = css({
  height: '100%',
  width: '100%',
  display: 'block',
  '::before': {
    content: '""',
    position: 'sticky',
    top: 0,
    display: 'block',
    width: '100%',
    height: spacing[1],
    borderTop: `1px solid ${uiColors.gray.light2}`,
    background: `linear-gradient(${transparentize(
      0.89,
      uiColors.black
    )} 0%, ${transparentize(1, uiColors.black)} 100%)`,
    zIndex: 2,
  },
});

const scrollArea = css({
  overflow: 'auto',
  height: '100%',
  width: '100%',
  display: 'block',
});

function ScrollBox({
  children,
  className,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx(className, scrollboxStyles)}>
      <div className={scrollArea}>{children}</div>
    </div>
  );
}

export { ScrollBox };
