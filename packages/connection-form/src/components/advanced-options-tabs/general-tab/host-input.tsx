import React, { useCallback, useEffect, useState } from 'react';
import {
  Label,
  Icon,
  IconButton,
  TextInput,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import DirectConnectionInput from './direct-connection-input';
import FormFieldContainer from '../../form-field-container';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorMessageByFieldNameAndIndex,
  fieldNameHasError,
} from '../../../utils/validation';

const hostInputContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  marginBottom: spacing[2],
  marginTop: spacing[1],
});

const hostInputStyles = css({
  flexGrow: 1,
});

const hostActionButtonStyles = css({
  marginLeft: spacing[1],
  marginTop: spacing[1],
});

const inputFieldStyles = css({
  width: '50%',
});

function HostInput({
  errors,
  connectionStringUrl,
  updateConnectionFormField,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const [hosts, setHosts] = useState([...connectionStringUrl.hosts]);
  const { isSRV } = connectionStringUrl;

  const showDirectConnectionInput =
    connectionStringUrl
      .typedSearchParams<MongoClientOptions>()
      .get('directConnection') === 'true' ||
    (!connectionStringUrl.isSRV && hosts.length === 1);

  useEffect(() => {
    // Update the hosts in the state when the underlying connection string hosts
    // change. This can be when a user changes connections, pastes in a new
    // connection string, or changes a setting which also updates the hosts.
    setHosts([...connectionStringUrl.hosts]);
  }, [connectionStringUrl]);

  const onHostChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const newHosts = [...hosts];
      newHosts[index] = event.target.value || '';

      setHosts(newHosts);
      updateConnectionFormField({
        type: 'update-host',
        fieldIndex: index,
        newHostValue: event.target.value,
      });
    },
    [hosts, setHosts, updateConnectionFormField]
  );

  return (
    <>
      <FormFieldContainer className={inputFieldStyles}>
        <Label
          htmlFor="connection-host-input-0"
          id="connection-host-input-label"
        >
          {isSRV ? 'Hostname' : 'Host'}
        </Label>
        {hosts.map((host, index) => (
          <div className={hostInputContainerStyles} key={`host-${index}`} data-testid="host-input-container">
            <TextInput
              className={hostInputStyles}
              type="text"
              data-testid={`connection-host-input-${index}`}
              id={`connection-host-input-${index}`}
              aria-labelledby="connection-host-input-label"
              state={fieldNameHasError(errors, 'hosts') ? 'error' : undefined}
              errorMessage={errorMessageByFieldNameAndIndex(
                errors,
                'hosts',
                index
              )}
              value={`${host}`}
              onChange={(e) => onHostChange(e, index)}
            />
            {!isSRV && (
              <IconButton
                className={hostActionButtonStyles}
                aria-label="Add new host"
                type="button"
                data-testid="connection-add-host-button"
                onClick={() =>
                  updateConnectionFormField({
                    type: 'add-new-host',
                    fieldIndexToAddAfter: index,
                  })
                }
              >
                <Icon glyph="Plus" />
              </IconButton>
            )}
            {!isSRV && hosts.length > 1 && (
              <IconButton
                className={hostActionButtonStyles}
                aria-label="Remove host"
                type="button"
                data-testid="connection-remove-host-button"
                onClick={() =>
                  updateConnectionFormField({
                    type: 'remove-host',
                    fieldIndexToRemove: index,
                  })
                }
              >
                <Icon glyph="Minus" />
              </IconButton>
            )}
          </div>
        ))}
      </FormFieldContainer>
      {showDirectConnectionInput && (
        <FormFieldContainer>
          <DirectConnectionInput
            connectionStringUrl={connectionStringUrl}
            updateConnectionFormField={updateConnectionFormField}
          />
        </FormFieldContainer>
      )}
    </>
  );
}

export default HostInput;
