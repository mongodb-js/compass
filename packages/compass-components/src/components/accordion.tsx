import React, { useCallback } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useId } from '@react-aria/utils';
import { useDarkMode } from '../hooks/use-theme';

import { Description, Icon } from './leafygreen';

const summaryStyles = css({
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: 0,
  paddingRight: 0,
  border: 'none',
  background: 'none',
  borderRadius: '6px',
  boxShadow: 'none',
  transition: 'box-shadow 150ms ease-in-out',
  '&:hover': {
    cursor: 'pointer',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 3px ${palette.blue.light1}`,
  },
});

const summaryVariantStyles = {
  default: css({
    fontSize: 14,
    lineHeight: `${spacing[500]}px`,
  }),
  small: css({
    fontSize: spacing[300],
    lineHeight: `${spacing[500]}px`,
  }),
};

const iconVariantSizes = {
  default: spacing[400],
  small: 14,
};

const summaryLightThemeStyles = css({
  color: palette.gray.dark2,
});

const summaryDarkThemeStyles = css({
  color: palette.white,
});

const summaryIconContainerStyles = css({
  fontSize: 0,
  lineHeight: 0,
  padding: 0,
  paddingRight: spacing[150],
  'details[open] > summary & svg': {
    transform: 'rotate(90deg)',
  },
});

const summaryTextStyles = css({
  textAlign: 'left',
});

const summaryHintStyles = css({
  margin: 0,
  marginLeft: spacing[100],
  padding: 0,
  display: 'inline',
});

interface AccordionProps
  extends Omit<React.HTMLProps<HTMLDetailsElement>, 'size'> {
  text: string | React.ReactNode;
  hintText?: string;
  textClassName?: string;
  summaryTextClassName?: string;
  defaultOpen?: boolean;
  onOpenToggle?: (newValue: boolean) => void;
  size?: 'default' | 'small';
}

function Accordion({
  text,
  hintText,
  textClassName,
  summaryTextClassName,
  defaultOpen = false,
  onOpenToggle,
  size = 'default',
  ...props
}: React.PropsWithChildren<AccordionProps>): React.ReactElement {
  const darkMode = useDarkMode();
  const labelId = useId();
  const handleToggle = useCallback(
    (event: React.SyntheticEvent<HTMLElement>) => {
      const isOpen = (event.target as HTMLDetailsElement).open;
      onOpenToggle?.(isOpen);
    },
    [onOpenToggle]
  );
  return (
    <details open={defaultOpen} onToggle={handleToggle}>
      <summary
        className={cx(
          darkMode ? summaryDarkThemeStyles : summaryLightThemeStyles,
          summaryStyles,
          summaryVariantStyles[size],
          textClassName
        )}
        id={labelId}
        {...props}
      >
        <span className={summaryIconContainerStyles}>
          <Icon glyph={'ChevronRight'} size={iconVariantSizes[size]} />
        </span>

        <div className={cx(summaryTextStyles, summaryTextClassName)}>
          {text}
          {hintText && (
            <Description className={summaryHintStyles}>{hintText}</Description>
          )}
        </div>
      </summary>

      <div role="region" aria-labelledby={labelId}>
        {props.children}
      </div>
    </details>
  );
}

export { Accordion };
