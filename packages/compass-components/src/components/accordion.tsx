import React, { useState } from 'react';
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
  padding: spacing[1] / 2, // matches the line-height (16 + 4)
  paddingLeft: 0,
});
const buttonTextStyles = css({
  textAlign: 'left',
});
const buttonHintStyles = css({
  margin: 0,
  marginLeft: spacing[1],
  padding: 0,
  display: 'inline',
});
interface AccordionProps extends React.HTMLProps<HTMLButtonElement> {
  text: string | React.ReactNode;
  hintText?: string;
}
function Accordion({
  text,
  hintText,
  ...props
}: React.PropsWithChildren<AccordionProps>): React.ReactElement {
  const darkMode = useDarkMode();
  const [open, setOpen] = useState(false);
  const regionId = useId('region-');
  const labelId = useId('label-');
  return (
    <>
      <button
        {...props}
        className={cx(
          darkMode ? buttonDarkThemeStyles : buttonLightThemeStyles,
          buttonStyles
        )}
        id={labelId}
        type="button"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={regionId}
        onClick={() => {
          setOpen((currentOpen) => !currentOpen);
        }}
      >
        <span className={buttonIconContainerStyles}>
          <Icon glyph={open ? 'ChevronDown' : 'ChevronRight'} />
        </span>

        <div className={buttonTextStyles}>
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
