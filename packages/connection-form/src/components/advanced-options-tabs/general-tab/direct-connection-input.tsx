import React, { useCallback } from 'react';
import {
  Checkbox,
  Description,
  Label,
  css,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

const descriptionStyles = css({
  marginTop: spacing[100],
});

function DirectConnectionInput({
  connectionStringUrl,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const t = useTranslation();
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
          <Label htmlFor="direct-connection-checkbox">
            {t(
              'connections.form.general.directConnection',
              'Direct Connection'
            )}
          </Label>

          <Description className={descriptionStyles}>
            {t(
              'connections.form.general.directConnectionDescription',
              'Specifies whether to force dispatch all operations to the specified host.'
            )}
          </Description>
        </>
      }
      checked={isDirectConnection}
    />
  );
}

export default DirectConnectionInput;
