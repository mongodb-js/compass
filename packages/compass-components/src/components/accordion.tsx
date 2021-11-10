import React, { useState } from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css } from '@emotion/css';
import Icon from '@leafygreen-ui/icon';
import { uiColors } from '@leafygreen-ui/palette';
import { useId } from '@react-aria/utils';

const labelStyles = css({
  padding: 0,
  margin: 0,
  fontWeight: 'bold'
});

const buttonStyles = css({
  display: 'flex',
  alignItems: 'center',     
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderRadius: '6px',
  borderWidth: '1px',
  background: 'none',
  '&:focus-visible': {
    borderColor: uiColors.green.base
  }
})
const containerStyles = css({
  marginTop: spacing[3],
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    cursor: 'pointer'
  }
})
interface AccordionProps {
  dataTestId?: string,
  text: string
}
function Accordion(props: React.PropsWithChildren<AccordionProps>) : React.ReactElement {
  const [open, setOpen] = useState(false)
  const contentId = useId();
  return (
    <div data-testid={props.dataTestId}>
      <div
        className={containerStyles}
        onClick={(e) => setOpen(!open)}
      >
        <p className={labelStyles} >
          <button
            className={buttonStyles}
            type="button"
            aria-expanded={ open ? 'true' : 'false' }
            aria-controls={contentId}
          >
            <Icon glyph={ open ? 'ChevronDown' : 'ChevronRight'} />
            {props.text}  
          </button>
        </p>
      </div>
      
      {open && (
        <div id={contentId}>
          { props.children }      
        </div>
      )}
    </div>
  )
}

export default Accordion;