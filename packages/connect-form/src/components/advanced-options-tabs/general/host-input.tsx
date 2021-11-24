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
  ConnectFormFields,
  SetConnectionField,
} from '../../../hooks/use-connect-form';

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

const defaultHostname = 'localhost';
const defaultPort = 27017;

const invalidHostCharacterRegex = /[@]/;
const invalidSrvHostnameCharacterRegex = /[:@,]/;

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

function hostHasPortNumber(host: string): boolean {
  return host.includes(':') && !isNaN(Number(host.slice(host.indexOf(':'))));
}

function getPortFromHostOrDefault(host: string): number {
  if (hostHasPortNumber(host)) {
    // Incase the number is NaN this will return 27017.
    return Number(host.slice(host.indexOf(':'))) || 27017;
  }
  return defaultPort;
}

function getNextHostname(hosts: ConnectFormFields['hosts']): string {
  if (hosts.value.length < 1) {
    // Use the default host if we have no reference.
    return `${defaultHostname}:${defaultPort}`;
  }

  const lastHost = hosts.value[hosts.value.length - 1];
  const hostname = lastHost.includes(':')
    ? // TODO: one off?
      lastHost.slice(0, lastHost.indexOf(':'))
    : lastHost;

  const port = getPortFromHostOrDefault(lastHost);

  // Return the last hosts' hostname and port + 1.
  return `${hostname}:${port}`;
}

function HostInput({
  connectionStringUrl,
  isSRV,
  hosts,
  setConnectionField,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  isSRV: boolean;
  hosts: ConnectFormFields['hosts'];
  setConnectionField: SetConnectionField;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  return (
    <>
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
                updatedConnectionString.hosts.push(getNextHostname(hosts));
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
    </>
  );
}

export default HostInput;
