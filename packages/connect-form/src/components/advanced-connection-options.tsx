import React from 'react';
import { ConnectionOptions } from 'mongodb-data-service';

import AdvancedOptionsTabs from './advanced-options-tabs/advanced-options-tabs';
import { UpdateConnectionFormField } from '../hooks/use-connect-form';
import { ConnectionFormError } from '../utils/validation';

import { useUiKitContext } from '../contexts/ui-kit-context';

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
  const {
    Accordion,
    compassUIColors,
    spacing,
    css,
  } = useUiKitContext();

  const disabledOverlayStyles = css({
    position: 'absolute',
    top: 0,
    // Space around it to ensure added focus borders are covered.
    bottom: -spacing[1],
    left: -spacing[1],
    right: -spacing[1],
    backgroundColor: compassUIColors.transparentWhite,
    zIndex: 1,
    cursor: 'not-allowed',
  });
  
  const connectionTabsContainer = css({
    position: 'relative',
  });

  return (
    <Accordion text="Advanced Connection Options">
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
