import React from 'react';
import {
  Accordion,
  spacing,
  css,
  rgba,
  palette,
} from '@mongodb-js/compass-components';
import type { ConnectionOptions } from 'mongodb-data-service';

import AdvancedOptionsTabs from './advanced-options-tabs/advanced-options-tabs';
import type { UpdateConnectionFormField } from '../hooks/use-connect-form';
import type { ConnectionFormError } from '../utils/validation';

const disabledOverlayStyles = css({
  position: 'absolute',
  top: 0,
  // Space around it to ensure added focus borders are covered.
  bottom: -spacing[1],
  left: -spacing[1],
  right: -spacing[1],
  backgroundColor: rgba(palette.white, 0.5),
  zIndex: 1,
  cursor: 'not-allowed',
});

const connectionTabsContainer = css({
  position: 'relative',
});

function AdvancedConnectionOptions({
  disabled,
  errors,
  updateConnectionFormField,
  connectionOptions,
}: {
  errors: ConnectionFormError[];
  disabled: boolean;
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  return (
    <Accordion
      data-testid="advanced-connection-options"
      text="Advanced Connection Options"
    >
      <div className={connectionTabsContainer}>
        {disabled && (
          <div
            className={disabledOverlayStyles}
            title="The connection form is disabled when the connection string cannot be parsed."
          />
        )}
        <AdvancedOptionsTabs
          errors={errors}
          updateConnectionFormField={updateConnectionFormField}
          connectionOptions={connectionOptions}
        />
      </div>
    </Accordion>
  );
}

export default AdvancedConnectionOptions;
