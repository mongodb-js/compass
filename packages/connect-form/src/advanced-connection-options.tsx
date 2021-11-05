import React, { useState } from 'react';
import { Label, spacing } from '@mongodb-js/compass-components';
import { css } from '@emotion/css';
import Icon from '@leafygreen-ui/icon';

import AdvancedOptionsTabs from './advanced-options-tabs/advanced-options-tabs';

const labelStyles = css({
  padding: 0,
  margin: 0,
  fontWeight: 'bold'
});

const containerStyles = css({
  marginTop: spacing[3],
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    cursor: 'pointer'
  }
})

function AdvancedConnectionOptions() : React.ReactElement {
  const [open, setOpen] = useState(false)
  const chevronClass = open ? 'fa-chevron-down' : 'fa-chevron-right'
  return (
    <div>
      <div 
        className={containerStyles}
        onClick={(e) => setOpen(!open)}
      >
        <Icon glyph={ open ? 'ChevronDown' : 'ChevronRight'} />
        <p
          className={labelStyles}
          
        >Advanced connection options</p>
      </div>
      {open &&(
          <AdvancedOptionsTabs />
        )}
    </div>
    

  )
}

export default AdvancedConnectionOptions;