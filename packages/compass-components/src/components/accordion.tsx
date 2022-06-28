import React, { useState } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import { useId } from '@react-aria/utils';

import { Description, Icon } from './leafygreen';
import { defaultFontSize } from '../compass-font-sizes';
import { withTheme } from '../hooks/use-theme';

const buttonStyles = css({
  fontWeight: 'bold',
  fontSize: defaultFontSize,
  display: 'flex',
  alignItems: 'center',
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
    boxShadow: `0 0 0 3px ${uiColors.focus}`,
  },
});
const buttonLightThemeStyles = css({
  color: uiColors.gray.dark2,
});
const buttonDarkThemeStyles = css({
  color: uiColors.white,
});
const containerStyles = css({
  display: 'flex',
});
const buttonIconStyles = css({
  marginRight: spacing[1],
});
const buttonTextStyles = css({
  alignItems: 'baseline',
  display: 'flex',
});
const buttonHintStyles = css({
  margin: 0,
  marginLeft: spacing[1],
  padding: 0,
});
interface AccordionProps {
  darkMode?: boolean;
  'data-testid'?: string;
  text: string | React.ReactNode;
  hintText?: string;
}
function UnthemedAccordion({
  text,
  darkMode,
  hintText,
  ...props
}: React.PropsWithChildren<AccordionProps>): React.ReactElement {
  const [open, setOpen] = useState(false);
  const regionId = useId('region-');
  const labelId = useId('label-');
  return (
    <>
      <div className={containerStyles}>
        <button
          data-testid={props['data-testid']}
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
          <Icon
            className={buttonIconStyles}
            glyph={open ? 'ChevronDown' : 'ChevronRight'}
          />
          <div className={buttonTextStyles}>
            {text}
            {hintText && (
              <Description className={buttonHintStyles}>{hintText}</Description>
            )}
          </div>
        </button>
      </div>

      {open && (
        <div role="region" aria-labelledby={labelId} id={regionId}>
          {props.children}
        </div>
      )}
    </>
  );
}

const Accordion = withTheme(UnthemedAccordion);

export { Accordion };
