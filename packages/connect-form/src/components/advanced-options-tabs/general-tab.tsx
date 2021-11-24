import { css } from '@emotion/css';
import React from 'react';
import {
  Checkbox,
  Label,
  Icon,
  IconButton,
  TextInput,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

// import { useConnectionStringContext } from '../../contexts/connection-string-context';
import SchemaInput from './general/schema-input';
import { ConnectFormFields } from '../../hooks/use-connect-form';

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

function GeneralTab({
  fields,
  connectionStringUrl,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  fields: ConnectFormFields;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  // const [connectionStringUrl, { setConnectionString }] =
  //   useConnectionStringContext();

  const { isSRV } = connectionStringUrl;

  const { hosts, directConnection } = fields;

  if (!connectionStringUrl) {
    // TODO: Make this required to have a value?
    return <div>No connectionStringUrl</div>;
  }

  return (
    <div>
      <SchemaInput
        connectionStringUrl={connectionStringUrl}
        setConnectionStringUrl={setConnectionStringUrl}
      />
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
            // label="Host"
            // state="none"|"error"
            // aria-label="Connection Hostname(s)"
            value={host}
            onChange={(event) => {
              // const updatedHosts = [
              //   ...updatedConnectionString.hosts
              // ];
              // updatedHosts[index] = event.target.value;
              // setConnectionItem('hosts', )

              const updatedConnectionString = connectionStringUrl.clone();
              // TODO: Validation on the hostname.
              // Keep in state and allow invalid.

              updatedConnectionString.hosts[index] = event.target.value;

              // // TODO: Use different api setConnectionItem
              setConnectionStringUrl(updatedConnectionString);
            }}
          />

          {/* TODO: Should we still show a + but then give them a message when they try and click w/ srvs? */}
          {!isSRV && (
            <IconButton
              aria-label="Add another host"
              onClick={() => {
                const updatedConnectionString = connectionStringUrl.clone();

                // TODO: Default new host name?
                updatedConnectionString.hosts.push(defaultNewHost);

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

      {!isSRV && (
        <Checkbox
          onChange={(event) => {
            // TODO: Ensure it's a valid connection string first? try catch?
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
          checked={directConnection.value}
          bold={false}
        />
      )}
    </div>
  );
}

export default GeneralTab;
