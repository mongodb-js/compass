import React, { useCallback } from 'react';
import { Checkbox, Description } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

function DirectConnectionInput({
  connectionStringUrl,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const isDirectConnection =
    connectionStringUrl
      .typedSearchParams<MongoClientOptions>()
      .get('directConnection') === 'true';

  const updateDirectConnection = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-direct-connection',
        isDirectConnection: event.target.checked,
      });
    },
    [updateConnectionFormField]
  );

  return (
    <>
      <Checkbox
        onChange={updateDirectConnection}
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
