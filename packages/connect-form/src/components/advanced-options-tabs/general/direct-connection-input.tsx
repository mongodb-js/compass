import React from 'react';
import { Checkbox, Description } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

function DirectConnectionInput({
  connectionStringUrl,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  const isDirectConnection =
    connectionStringUrl.searchParams.get('directConnection') === 'true';

  function updateDirectConnection(newIsDirectConnection: boolean) {
    const updatedConnectionString = connectionStringUrl.clone();
    if (newIsDirectConnection) {
      updatedConnectionString.searchParams.set('directConnection', 'true');
    } else if (updatedConnectionString.searchParams.get('directConnection')) {
      updatedConnectionString.searchParams.delete('directConnection');
    }

    setConnectionStringUrl(updatedConnectionString);
  }

  return (
    <>
      <Checkbox
        onChange={(event) => updateDirectConnection(event.target.checked)}
        label="Direct Connection"
        checked={isDirectConnection}
        bold={false}
      />
      <Description>
        Specifies whether to force dispatch all operations to the specified
        host.
      </Description>
    </>
  );
}

export default DirectConnectionInput;
