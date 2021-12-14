import { css } from '@emotion/css';
import React from 'react';
import {
  Label,
  Icon,
  IconButton,
  TextInput,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import {
  UpdateConnectionFormField
} from '../../../hooks/use-connect-form';
import { ConnectionFormError } from '../../../utils/connect-form-errors';
import { MARKABLE_FORM_FIELD_NAMES } from '../../../constants/markable-form-fields';

const hostInputContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  alignItems: 'center',
  marginBottom: spacing[2],
});

const hostInputStyles = css({
  flexGrow: 1,
});

const hostActionButtonStyles = css({
  marginLeft: spacing[1],
});

function HostInput({
  errors,
  connectionStringUrl,
  hosts,
  updateConnectionFormField
}: {
  errors: ConnectionFormError[],
  connectionStringUrl: ConnectionStringUrl;
  hosts: string[];
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const { isSRV } = connectionStringUrl;

  function onHostChange(
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) {
    updateConnectionFormField({
      type: 'update-host',
      hostIndex: index,
      newHostValue: event.target.value
    });
  }

  const hostsError = errors.find(
    error => error.fieldName === MARKABLE_FORM_FIELD_NAMES.HOSTS
  );

  return (
    <>
      <Label htmlFor="connection-host-input" id="connection-host-input-label">
        {isSRV ? 'Hostname' : 'Host'}
      </Label>
      {hosts.map((host, index) => (
        <div className={hostInputContainerStyles} key={`host-${index}`}>
          <TextInput
            className={hostInputStyles}
            type="text"
            id="connection-host-input"
            aria-labelledby="connection-host-input-label"
            state={hostsError ? 'error' : undefined}
            // Only show the error message on the last host.
            errorMessage={
              hostsError && index === hosts.length - 1
                ? hostsError.message
                : undefined
            }
            value={`${host}`}
            onChange={(e) => onHostChange(e, index)}
          />
          {!isSRV && (
            <IconButton
              className={hostActionButtonStyles}
              aria-label="Add new host"
              onClick={() => updateConnectionFormField({
                type: 'add-new-host',
                hostIndexToAddAfter: index
              })}
            >
              <Icon glyph="Plus" />
            </IconButton>
          )}
          {!isSRV && hosts.length > 1 && (
            <IconButton
              className={hostActionButtonStyles}
              aria-label="Remove host"
              onClick={() => updateConnectionFormField({
                type: 'remove-host',
                hostIndexToRemove: index
              })}
            >
              <Icon glyph="Minus" />
            </IconButton>
          )}
        </div>
      ))}
    </>
  );
}

export default HostInput;
