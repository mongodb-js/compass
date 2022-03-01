import React, { useState } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css } from '@leafygreen-ui/emotion';
import Icon from '@leafygreen-ui/icon';
import { uiColors } from '@leafygreen-ui/palette';
import { useId } from '@react-aria/utils';

import { defaultFontSize } from '../compass-font-sizes';

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
const containerStyles = css({
  marginTop: spacing[3],
  display: 'flex',
  alignItems: 'center',
});
const buttonIconStyles = css({
  marginRight: spacing[1],
});
interface AccordionProps {
  'data-testid'?: string;
  text: string;
}
function Accordion(
  props: React.PropsWithChildren<AccordionProps>
): React.ReactElement {
  const [open, setOpen] = useState(false);
  const regionId = useId('region-');
  const labelId = useId('label-');
  return (
    <>
      <div className={containerStyles}>
        <button
          data-testid={props['data-testid']}
          className={buttonStyles}
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
          {props.text}
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

export default Accordion;
