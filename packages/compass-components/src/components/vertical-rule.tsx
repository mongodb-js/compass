import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import type { HTMLProps } from 'react';
import React, { forwardRef } from 'react';

import { useDarkMode } from '../hooks/use-theme';

const verticalRuleStyles = css({
  height: '100%',
  width: 0,
  display: 'block',
  borderTopWidth: 1,
  borderTopStyle: 'solid',
});

const verticalRuleStylesLight = css({
  borderTopColor: palette.gray.light2,
});

const verticalRuleStylesDark = css({
  borderTopColor: palette.gray.dark2,
});

export const VerticalRule = forwardRef<
  HTMLDivElement,
  HTMLProps<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const darkMode = useDarkMode();
  return (
    <div
      ref={ref}
      className={cx(
        verticalRuleStyles,
        darkMode ? verticalRuleStylesDark : verticalRuleStylesLight,
        className
      )}
      {...props}
    />
  );
});

VerticalRule.displayName = 'VerticalRule';
