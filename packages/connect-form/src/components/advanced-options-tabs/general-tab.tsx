import { css } from '@emotion/css';
import React from 'react';
import {
  Checkbox,
  Description,
  Label,
  Icon,
  IconButton,
  TextInput,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import SchemaInput from './general/schema-input';
import {
  ConnectFormFields,
  SetConnectionField,
} from '../../hooks/use-connect-form';
import FormFieldContainer from '../form-field-container';

const hostInputContainer = css({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  alignItems: 'center',
  marginBottom: spacing[2],
});

const hostInput = css({
  flexGrow: 1,
});

const defaultNewHost = 'localhost:27017';

const invalidHostCharacterRegex = /[^a-z0-9A-Z-/.:]/;
const invalidSrvHostnameCharacterRegex = /[^a-z0-9A-Z/.-]/;

function checkForInvalidCharacterInHost(host: string, isSRV: boolean): void {
  const hostRegex = isSRV
    ? invalidSrvHostnameCharacterRegex
    : invalidHostCharacterRegex;

  const invalidCharacterInHost = hostRegex.exec(host);
  if (invalidCharacterInHost) {
    throw new Error(
      `Invalid character in host: '${invalidCharacterInHost[0]}'`
    );
  }
}

function GeneralTab({
  fields,
  connectionStringUrl,
  setConnectionField,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  fields: ConnectFormFields;
  setConnectionField: SetConnectionField;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  const { isSRV } = connectionStringUrl;

  const directConnection =
    connectionStringUrl.searchParams.get('directConnection') === 'true';

  const { hosts } = fields;

  return (
    <div>
      <FormFieldContainer>
        <SchemaInput
          connectionStringUrl={connectionStringUrl}
          setConnectionStringUrl={setConnectionStringUrl}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Label htmlFor="connection-host-input" id="connection-host-input-label">
          {isSRV ? 'Hostname' : 'Host'}
        </Label>
        {hosts.value.map((host, index) => (
          <div className={hostInputContainer} key={`host-${index}`}>
            <TextInput
              className={hostInput}
              type="text"
              id="connection-host-input"
              aria-labelledby="connection-host-input-label"
              state={hosts.error ? 'error' : undefined}
              errorMessage={hosts.error ? hosts.error : undefined}
              value={`${host}`}
              onChange={(event) => {
                try {
                  checkForInvalidCharacterInHost(event.target.value, isSRV);

                  const updatedConnectionString = connectionStringUrl.clone();

                  updatedConnectionString.hosts[index] = event.target.value;

                  // Build a new connection string url to ensure the validity
                  // of the update.
                  const newConnectionString = new ConnectionStringUrl(
                    updatedConnectionString.toString()
                  );

                  // When there is no error updating the host we update the
                  // entire connection string url so that it is
                  // applied to the other fields/connection string.
                  setConnectionStringUrl(newConnectionString);
                } catch (err) {
                  // The host value is invalid, so we show the error and allow
                  // the user to update it until we can update the
                  // connection string url.
                  const updatedHosts = [...hosts.value];
                  updatedHosts[index] = event.target.value;
                  setConnectionField('hosts', {
                    value: updatedHosts,
                    error: (err as Error).message,
                    warning: null,
                  });
                }
              }}
            />

            {!isSRV && (
              <IconButton
                aria-label="Add another host"
                onClick={() => {
                  const updatedConnectionString = connectionStringUrl.clone();

                  // TODO: Give default hostname the same host + 1 port on default
                  updatedConnectionString.hosts.push(defaultNewHost);

                  if (
                    updatedConnectionString.searchParams.get('directConnection')
                  ) {
                    updatedConnectionString.searchParams.delete(
                      'directConnection'
                    );
                  }

                  setConnectionStringUrl(updatedConnectionString);
                }}
              >
                <Icon glyph="Plus" />
              </IconButton>
            )}
            {!isSRV && hosts.value.length > 1 && (
              <IconButton
                aria-label="Remove host"
                onClick={() => {
                  const updatedConnectionString = connectionStringUrl.clone();

                  updatedConnectionString.hosts.splice(index, 1);

                  setConnectionStringUrl(updatedConnectionString);
                }}
              >
                <Icon glyph="Minus" />
              </IconButton>
            )}
          </div>
        ))}
      </FormFieldContainer>

      {!isSRV && hosts.value.length === 1 && (
        <FormFieldContainer>
          <Checkbox
            onChange={(event) => {
              const updatedConnectionString = connectionStringUrl.clone();
              if (event.target.checked) {
                updatedConnectionString.searchParams.set(
                  'directConnection',
                  'true'
                );
              } else if (
                updatedConnectionString.searchParams.get('directConnection')
              ) {
                updatedConnectionString.searchParams.delete('directConnection');
              }

              setConnectionStringUrl(updatedConnectionString);
            }}
            label="Direct Connection"
            checked={directConnection}
            bold={false}
          />
          <Description>
            Specifies whether to force dispatch all operations to the specified
            host.
          </Description>
        </FormFieldContainer>
      )}
    </div>
  );
}

export default GeneralTab;
