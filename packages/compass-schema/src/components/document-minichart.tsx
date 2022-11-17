import React from 'react';
import { Body } from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';

function DocumentMinichart({
  nestedDocType,
}: {
  nestedDocType?: {
    fields?: Document[];
  };
}) {
  let docFieldsMessage = '';
  if (nestedDocType) {
    const numFields = nestedDocType.fields?.length ?? 0;
    docFieldsMessage = `Document with ${numFields} nested field${
      numFields === 1 ? '' : 's'
    }.`;
  }

  return <Body>{docFieldsMessage}</Body>;
}

export default DocumentMinichart;
