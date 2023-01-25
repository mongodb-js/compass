import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import type { HTMLProps } from 'react';
import React, { forwardRef } from 'react';

import { useDarkMode } from '../hooks/use-theme';

const horizontalRuleStyles = css({
  height: 0,
  width: '100%',
  display: 'block',
  borderTopWidth: 1,
  borderTopStyle: 'solid',
});

const horizontalRuleStylesLight = css({
  borderTopColor: palette.gray.light2,
});

const horizontalRuleStylesDark = css({
  borderTopColor: palette.gray.dark2,
});

export const HorizontalRule = forwardRef<
  HTMLDivElement,
  HTMLProps<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const darkMode = useDarkMode();
  return (
    <div
      ref={ref}
      className={cx(
        horizontalRuleStyles,
        darkMode ? horizontalRuleStylesDark : horizontalRuleStylesLight,
        className
      )}
      {...props}
    />
  );
});

HorizontalRule.displayName = 'HorizontalRule';
