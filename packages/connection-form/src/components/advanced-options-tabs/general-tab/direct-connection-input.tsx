import React, { useCallback } from 'react';
import {
  Checkbox,
  Description,
  Label,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

const descriptionStyles = css({
  marginTop: spacing[1],
});

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
      if (!event.target.checked) {
        return updateConnectionFormField({
          type: 'delete-search-param',
          key: 'directConnection',
        });
      }
      return updateConnectionFormField({
        type: 'update-search-param',
        currentKey: 'directConnection',
        value: event.target.checked ? 'true' : 'false',
      });
    },
    [updateConnectionFormField]
  );

  return (
    <Checkbox
      onChange={updateDirectConnection}
      id="direct-connection-checkbox"
      label={
        <>
          <Label htmlFor="direct-connection-checkbox">Direct Connection</Label>

          <Description className={descriptionStyles}>
            Specifies whether to force dispatch all operations to the specified
            host.
          </Description>
        </>
      }
      checked={isDirectConnection}
    />
  );
}

export default DirectConnectionInput;
