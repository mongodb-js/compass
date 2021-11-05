import React, { useState } from 'react';
import { Label, spacing } from '@mongodb-js/compass-components';
import { css } from '@emotion/css';

import AdvancedOptionsTabs from './advanced-options-tabs/advanced-options-tabs';

const labelStyles = css({
  padding: 0,
  margin: 0,
  marginTop: spacing[3],
});

function AdvancedConnectionOptions() : React.ReactElement {
  const [open, setOpen] = useState(false)
  const chevronClass = open ? 'fa-chevron-down' : 'fa-chevron-right'
  return (
    <div>
      <Label htmlFor={''} className={labelStyles}
        onClick={(e) => setOpen(!open)}
      >
        <i className={'fa ' + chevronClass}></i>&nbsp;
        Advanced connection options</Label>

      {open &&(
        <AdvancedOptionsTabs />
      )}
    </div>
   

  )
}

export default AdvancedConnectionOptions;