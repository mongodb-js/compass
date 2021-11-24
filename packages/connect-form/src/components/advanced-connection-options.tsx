import { css } from '@emotion/css';
import React from 'react';
import { Accordion, spacing } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import AdvancedOptionsTabs from './advanced-options-tabs/advanced-options-tabs';
import {
  ConnectFormFields,
  SetConnectionField,
} from '../hooks/use-connect-form';

const disabledOverlayStyles = css({
  position: 'absolute',
  // Space around it to ensure added borders are covered.
  top: -spacing[1],
  bottom: -spacing[1],
  left: -spacing[1],
  right: -spacing[1],
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  zIndex: 1,
  cursor: 'not-allowed',
});

const connectionTabsContainer = css({
  position: 'relative',
});

function AdvancedConnectionOptions({
  disabled,
  fields,
  connectionStringUrl,
  setConnectionField,
  setConnectionStringUrl,
}: {
  disabled: boolean;
  fields: ConnectFormFields;
  connectionStringUrl: ConnectionStringUrl;
  setConnectionField: SetConnectionField;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  return (
    <Accordion text="Advanced Connection Options">
      <div className={connectionTabsContainer}>
        {disabled && (
          <div
            className={disabledOverlayStyles}
            title="Connection form disabled while connection string cannot be parsed."
          />
        )}
        <AdvancedOptionsTabs
          fields={fields}
          setConnectionField={setConnectionField}
          connectionStringUrl={connectionStringUrl}
          setConnectionStringUrl={setConnectionStringUrl}
        />
      </div>
    </Accordion>
  );
}

export default AdvancedConnectionOptions;
