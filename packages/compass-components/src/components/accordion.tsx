import React, { useCallback, useState } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useId } from '@react-aria/utils';
import { useDarkMode } from '../hooks/use-theme';

import { Description, Icon } from './leafygreen';
import { useCurrentValueRef } from '../hooks/use-current-value-ref';

const buttonStyles = css({
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

const buttonVariantStyles = {
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

const buttonLightThemeStyles = css({
  color: palette.gray.dark2,
});

const buttonDarkThemeStyles = css({
  color: palette.white,
});

const buttonIconContainerStyles = css({
  fontSize: 0,
  lineHeight: 0,
  padding: 0,
  paddingRight: spacing[150],
});

const buttonTextStyles = css({
  textAlign: 'left',
});

const buttonHintStyles = css({
  margin: 0,
  marginLeft: spacing[100],
  padding: 0,
  display: 'inline',
});

interface AccordionProps
  extends Omit<React.HTMLProps<HTMLButtonElement>, 'size'> {
  text: string | React.ReactNode;
  hintText?: string;
  textClassName?: string;
  buttonTextClassName?: string;
  open?: boolean;
  defaultOpen?: boolean;
  setOpen?: (newValue: boolean) => void;
  size?: 'default' | 'small';
}

function Accordion({
  text,
  hintText,
  textClassName,
  buttonTextClassName,
  open: _open,
  setOpen: _setOpen,
  defaultOpen = false,
  size = 'default',
  ...props
}: React.PropsWithChildren<AccordionProps>): React.ReactElement {
  const darkMode = useDarkMode();
  const [localOpen, setLocalOpen] = useState(_open ?? defaultOpen);
  const setOpenRef = useCurrentValueRef(_setOpen);
  const onOpenChange = useCallback(() => {
    setLocalOpen((prevValue) => {
      const newValue = !prevValue;
      setOpenRef.current?.(newValue);
      return newValue;
    });
  }, [setOpenRef]);
  const regionId = useId();
  const labelId = useId();
  const open = typeof _open !== 'undefined' ? _open : localOpen;
  return (
    <>
      <button
        {...props}
        className={cx(
          darkMode ? buttonDarkThemeStyles : buttonLightThemeStyles,
          buttonStyles,
          buttonVariantStyles[size],
          textClassName
        )}
        id={labelId}
        type="button"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={regionId}
        onClick={onOpenChange}
      >
        <span className={buttonIconContainerStyles}>
          <Icon
            glyph={open ? 'ChevronDown' : 'ChevronRight'}
            size={iconVariantSizes[size]}
          />
        </span>

        <div className={cx(buttonTextStyles, buttonTextClassName)}>
          {text}
          {hintText && (
            <Description className={buttonHintStyles}>{hintText}</Description>
          )}
        </div>
      </button>

      {open && (
        <div role="region" aria-labelledby={labelId} id={regionId}>
          {props.children}
        </div>
      )}
    </>
  );
}

export { Accordion };
