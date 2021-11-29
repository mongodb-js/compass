import React from 'react';
import { Accordion } from '@mongodb-js/compass-components';
import AdvancedOptionsTabs from './advanced-options-tabs/advanced-options-tabs';

function AdvancedConnectionOptions(): React.ReactElement {
  return (
    <Accordion text="Advanced Connection Options">
      <AdvancedOptionsTabs />
    </Accordion>
  );
}

export default AdvancedConnectionOptions;
