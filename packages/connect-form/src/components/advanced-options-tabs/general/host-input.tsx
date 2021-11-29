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
  return (
    host.includes(':') && !isNaN(Number(host.slice(host.indexOf(':') + 1)))
  );
}

function getPortFromHostOrDefault(host: string): number {
  if (hostHasPortNumber(host)) {
    // Incase the number is NaN this will return 27017.
    return Number(host.slice(host.indexOf(':') + 1)) || 27017;
  }
  return defaultPort;
}

function getNextHostname(
  hosts: ConnectFormFields['hosts'],
  addAfterIndex: number
): string {
  if (hosts.value.length < 1) {
    // Use the default host if we have no reference.
    return `${defaultHostname}:${defaultPort}`;
  }

  const hostToAddAfter = hosts.value[addAfterIndex];
  const hostname = hostToAddAfter.includes(':')
    ? hostToAddAfter.slice(0, hostToAddAfter.indexOf(':'))
    : hostToAddAfter;

  const port = getPortFromHostOrDefault(hostToAddAfter) + 1;

  // Return the last hosts' hostname and port + 1.
  return `${hostname}:${port}`;
}

function HostInput({
  connectionStringUrl,
  hosts,
  setConnectionField,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  hosts: ConnectFormFields['hosts'];
  setConnectionField: SetConnectionField;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  const { isSRV } = connectionStringUrl;

  function onHostChange(
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) {
    try {
      checkForInvalidCharacterInHost(event.target.value, isSRV);

      const updatedConnectionString = connectionStringUrl.clone();

      updatedConnectionString.hosts[index] = event.target.value || '';

      // Build a new connection string url to ensure the
      // validity of the update.
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
  }

  function onAddHost(addAfterIndex: number) {
    const updatedConnectionString = connectionStringUrl.clone();
    const newHostName = getNextHostname(hosts, addAfterIndex);
    updatedConnectionString.hosts.splice(addAfterIndex + 1, 0, newHostName);
    if (updatedConnectionString.searchParams.get('directConnection')) {
      updatedConnectionString.searchParams.delete('directConnection');
    }

    setConnectionStringUrl(updatedConnectionString);
  }

  function onRemoveHost(index: number) {
    const updatedConnectionString = connectionStringUrl.clone();

    updatedConnectionString.hosts.splice(index, 1);

    if (
      updatedConnectionString.hosts.length === 1 &&
      !updatedConnectionString.hosts[0]
    ) {
      // If the user removes a host, leaving a single empty host, it will
      // create an invalid connection string. Here we default the value.
      updatedConnectionString.hosts[0] = `${defaultHostname}:${defaultPort}`;
    }

    setConnectionStringUrl(updatedConnectionString);
  }

  return (
    <>
      <Label htmlFor="connection-host-input" id="connection-host-input-label">
        {isSRV ? 'Hostname' : 'Host'}
      </Label>
      {hosts.value.map((host, index) => (
        <div className={hostInputContainerStyles} key={`host-${index}`}>
          <TextInput
            className={hostInputStyles}
            type="text"
            id="connection-host-input"
            aria-labelledby="connection-host-input-label"
            state={hosts.error ? 'error' : undefined}
            // Only show the error message on the last host.
            errorMessage={
              hosts.error && index === hosts.value.length - 1
                ? hosts.error
                : undefined
            }
            value={`${host}`}
            onChange={(e) => onHostChange(e, index)}
          />
          {!isSRV && (
            <IconButton
              className={hostActionButtonStyles}
              aria-label="Add new host"
              onClick={() => onAddHost(index)}
            >
              <Icon glyph="Plus" />
            </IconButton>
          )}
          {!isSRV && hosts.value.length > 1 && (
            <IconButton
              className={hostActionButtonStyles}
              aria-label="Remove host"
              onClick={() => onRemoveHost(index)}
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
