import React from 'react';
import { Checkbox, Description } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

function DirectConnectionInput({
  connectionStringUrl,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const isDirectConnection =
    connectionStringUrl.searchParams.get('directConnection') === 'true';

  function updateDirectConnection(newIsDirectConnection: boolean) {
    updateConnectionFormField({
      type: 'update-direct-connection',
      isDirectConnection: newIsDirectConnection
    })
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
