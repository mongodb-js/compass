import React, { useCallback } from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

import { useUiKitContext } from '../../../contexts/ui-kit-context';

function DirectConnectionInput({
  connectionStringUrl,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const { Checkbox, Description } = useUiKitContext();

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
