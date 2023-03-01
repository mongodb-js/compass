import React, { useCallback, useEffect, useState } from 'react';
import {
  FormFieldContainer,
  Label,
  TextInput,
  ListEditor,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import DirectConnectionInput from './direct-connection-input';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorMessageByFieldNameAndIndex,
  fieldNameHasError,
} from '../../../utils/validation';

const listInputStyles = css({
  maxWidth: spacing[7] * 5,
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
      <FormFieldContainer>
        <Label
          htmlFor="connection-host-input-0"
          id="connection-host-input-label"
        >
          {isSRV ? 'Hostname' : 'Host'}
        </Label>
        <ListEditor
          items={hosts}
          className={listInputStyles}
          renderItem={(host: string, index: number) => (
            <TextInput
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
          )}
          disableAddButton={() => isSRV}
          disableRemoveButton={() => isSRV || hosts.length <= 1}
          onAddItem={(indexBefore) =>
            updateConnectionFormField({
              type: 'add-new-host',
              fieldIndexToAddAfter: indexBefore,
            })
          }
          onRemoveItem={(index: number) =>
            updateConnectionFormField({
              type: 'remove-host',
              fieldIndexToRemove: index,
            })
          }
          addButtonTestId="connection-add-host-button"
          removeButtonTestId="connection-remove-host-button"
        />
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
