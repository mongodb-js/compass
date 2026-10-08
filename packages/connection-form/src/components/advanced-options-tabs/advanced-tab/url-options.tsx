import React from 'react';
import {
  spacing,
  Body,
  Description,
  Link,
  css,
  useTranslation,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

import UrlOptionsListEditor from './url-options-list-editor';

const urlOptionsContainerStyles = css({
  marginTop: spacing[400],
});

const urlOptionsDescriptionStyles = css({
  marginTop: spacing[100],
  marginBottom: spacing[200],
});

function UrlOptions({
  updateConnectionFormField,
  connectionStringUrl,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  connectionStringUrl: ConnectionStringUrl;
}): React.ReactElement {
  const t = useTranslation();
  return (
    <div className={urlOptionsContainerStyles} data-testid="url-options">
      <Body weight="medium">
        {t('connections.form.advanced.uriOptions', 'URI Options')}
      </Body>
      <Description className={urlOptionsDescriptionStyles}>
        {t(
          'connections.form.advanced.uriOptionsDescription',
          'Add additional MongoDB URI options to customize your connection.'
        )}
        &nbsp;
        <Link
          href={
            'https://docs.mongodb.com/manual/reference/connection-string/#connection-string-options'
          }
        >
          {t('connections.form.advanced.learnMore', 'Learn More')}
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
