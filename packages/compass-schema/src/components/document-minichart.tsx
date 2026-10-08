import React from 'react';
import { Body, useTranslation } from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';

function DocumentMinichart({
  nestedDocType,
}: {
  nestedDocType?: {
    fields?: Document[];
  };
}) {
  const t = useTranslation();
  let docFieldsMessage = '';
  if (nestedDocType) {
    const numFields = nestedDocType.fields?.length ?? 0;
    docFieldsMessage =
      numFields === 1
        ? t(
            'schema.documentMinichart.nestedFieldOne',
            'Document with {count} nested field.',
            { count: numFields }
          )
        : t(
            'schema.documentMinichart.nestedFieldOther',
            'Document with {count} nested fields.',
            { count: numFields }
          );
  }

  return <Body>{docFieldsMessage}</Body>;
}

export default DocumentMinichart;
