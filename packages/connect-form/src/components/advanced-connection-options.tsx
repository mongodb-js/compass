import React from 'react';
import { Accordion } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import AdvancedOptionsTabs from './advanced-options-tabs/advanced-options-tabs';
import {
  ConnectFormFields,
  SetConnectionField,
} from '../hooks/use-connect-form';

function AdvancedConnectionOptions({
  fields,
  connectionStringUrl,
  setConnectionField,
  setConnectionStringUrl,
}: {
  fields: ConnectFormFields;
  connectionStringUrl: ConnectionStringUrl;
  setConnectionField: SetConnectionField;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  return (
    <Accordion text="Advanced Connection Options">
      <AdvancedOptionsTabs
        fields={fields}
        setConnectionField={setConnectionField}
        connectionStringUrl={connectionStringUrl}
        setConnectionStringUrl={setConnectionStringUrl}
      />
    </Accordion>
  );
}

export default AdvancedConnectionOptions;
