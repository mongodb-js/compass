import React from 'react';
import {
  spacing,
  Body,
  Description,
  Link,
  css,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

import UrlOptionsListEditor from './url-options-list-editor';

const urlOptionsContainerStyles = css({
  marginTop: spacing[3],
});

const urlOptionsDescriptionStyles = css({
  marginTop: spacing[1],
  marginBottom: spacing[2],
});

function UrlOptions({
  updateConnectionFormField,
  connectionStringUrl,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  connectionStringUrl: ConnectionStringUrl;
}): React.ReactElement {
  return (
    <div className={urlOptionsContainerStyles} data-testid="url-options">
      <Body weight="medium">URI Options</Body>
      <Description className={urlOptionsDescriptionStyles}>
        Add additional MongoDB URI options to customize your connection.&nbsp;
        <Link
          href={
            'https://docs.mongodb.com/manual/reference/connection-string/#connection-string-options'
          }
        >
          Learn More
        </Link>
      </Description>
      <UrlOptionsListEditor
        connectionStringUrl={connectionStringUrl}
        updateConnectionFormField={updateConnectionFormField}
      />
    </div>
  );
}

export default UrlOptions;
