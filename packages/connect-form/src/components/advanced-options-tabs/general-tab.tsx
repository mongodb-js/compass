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

import { useConnectionStringContext } from '../../contexts/connection-string-context';
import SchemaInput from './general/schema-input';

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

function GeneralTab(): React.ReactElement {
  const [connectionStringUrl, { setConnectionString }] =
    useConnectionStringContext();

  return (
    <div>
      <SchemaInput />
      <Label htmlFor="connection-host-input" id="connection-host-input-label">
        {connectionStringUrl.isSRV ? 'Hostname' : 'Host'}
      </Label>
      {connectionStringUrl.hosts.map((host, index) => (
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
              const updatedConnectionString = connectionStringUrl.clone();
              // TODO: Validation on the hostname.
              // Keep in state and allow invalid.

              updatedConnectionString.hosts[index] = event.target.value;

              setConnectionString(updatedConnectionString.toString());
            }}
          />

          {/* TODO: Should we still show a + but then give them a message when they try and click w/ srvs? */}
          {!connectionStringUrl.isSRV && (
            <IconButton
              aria-label="Add another host"
              onClick={() => {
                const updatedConnectionString = connectionStringUrl.clone();

                // TODO: Default new host name?
                updatedConnectionString.hosts.push('');

                setConnectionString(updatedConnectionString.toString());
              }}
            >
              <Icon glyph="Plus" />
            </IconButton>
          )}
          {!connectionStringUrl.isSRV && connectionStringUrl.hosts.length > 1 && (
            <IconButton
              aria-label="Remove host"
              onClick={() => {
                const updatedConnectionString = connectionStringUrl.clone();

                updatedConnectionString.hosts.splice(index, 1);

                setConnectionString(updatedConnectionString.toString());
              }}
            >
              <Icon glyph="Minus" />
            </IconButton>
          )}
        </div>
      ))}

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

          setConnectionString(updatedConnectionString.toString());
        }}
        label="Direct Connection"
        checked={
          connectionStringUrl.searchParams.get('directConnection') === 'true'
        }
        bold={false}
      />
    </div>
  );
}

export default GeneralTab;
