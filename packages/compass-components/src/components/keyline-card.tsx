import React, { forwardRef } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useDarkMode } from '../hooks/use-theme';

const keylineStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: spacing[2],
});

const keylineLightThemeStyles = css({
  background: palette.white,
});
const keylineDarkThemeStyles = css({
  background: palette.black,
  borderColor: palette.gray.dark2,
});

const KeylineCard = forwardRef(function KeylineCard(
  { className, ...props }: React.HTMLProps<HTMLDivElement>,
  ref: React.ForwardedRef<HTMLDivElement>
): React.ReactElement {
  const darkMode = useDarkMode();

  return (
    <div
      ref={ref}
      className={cx(
        keylineStyles,
        darkMode ? keylineDarkThemeStyles : keylineLightThemeStyles,
        className
      )}
      {...props}
    ></div>
  );
});

export { KeylineCard };
