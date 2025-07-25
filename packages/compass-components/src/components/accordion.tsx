import React, { useCallback, useRef, useState } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useId } from '@react-aria/utils';
import { useDarkMode } from '../hooks/use-theme';

import { Description, Icon } from './leafygreen';

const buttonStyles = css({
  fontWeight: 'bold',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'flex-start',
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

const buttonLightThemeStyles = css({
  color: palette.gray.dark2,
});
const buttonDarkThemeStyles = css({
  color: palette.white,
});
const buttonIconContainerStyles = css({
  padding: spacing[100] / 2, // matches the line-height (16 + 4)
  paddingLeft: 0,
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
interface AccordionProps extends React.HTMLProps<HTMLButtonElement> {
  text: string | React.ReactNode;
  hintText?: string;
  textClassName?: string;
  buttonTextClassName?: string;
  open?: boolean;
  defaultOpen?: boolean;
  setOpen?: (newValue: boolean) => void;
}
function Accordion({
  text,
  hintText,
  textClassName,
  buttonTextClassName,
  open: _open,
  setOpen: _setOpen,
  defaultOpen = false,
  ...props
}: React.PropsWithChildren<AccordionProps>): React.ReactElement {
  const darkMode = useDarkMode();
  const [localOpen, setLocalOpen] = useState(_open ?? defaultOpen);
  const setOpenRef = useRef(_setOpen);
  setOpenRef.current = _setOpen;
  const onOpenChange = useCallback(() => {
    setLocalOpen((prevValue) => {
      const newValue = !prevValue;
      setOpenRef.current?.(newValue);
      return newValue;
    });
  }, []);
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
          textClassName
        )}
        id={labelId}
        type="button"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={regionId}
        onClick={onOpenChange}
      >
        <span className={buttonIconContainerStyles}>
          <Icon glyph={open ? 'ChevronDown' : 'ChevronRight'} />
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
