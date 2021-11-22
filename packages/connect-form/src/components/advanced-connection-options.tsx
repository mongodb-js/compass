import React from 'react';
import { Accordion } from '@mongodb-js/compass-components';
import AdvancedOptionsTabs from './advanced-options-tabs/advanced-options-tabs';
import ConnectionStringUrl from 'mongodb-connection-string-url';

function AdvancedConnectionOptions({
  connectionStringUrl,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  return (
    <Accordion text="Advanced Connection Options">
      <AdvancedOptionsTabs
        connectionStringUrl={connectionStringUrl}
        setConnectionStringUrl={setConnectionStringUrl}
      />
    </Accordion>
  );
}

export default AdvancedConnectionOptions;
