import React from 'react';
import numeral from 'numeral';
import { Body } from '@mongodb-js/compass-components';

function ArrayMinichart({
  nestedDocType,
  type,
}: {
  nestedDocType?: {
    fields?: Document[];
  };
  type: {
    lengths: number[];
    averageLength: number;
  };
}) {
  let arrayOfFieldsMessage = '';
  if (nestedDocType) {
    const numFields = nestedDocType.fields?.length ?? 0;
    arrayOfFieldsMessage = `Array of documents with ${numFields} nested field${
      numFields === 1 ? '' : 's'
    }.`;
  }

  const minLength = Math.min(...type.lengths);
  const averageLength = numeral(type.averageLength).format('0.0[0]');
  const maxLength = Math.max(...type.lengths);

  return (
    <>
      <Body>{arrayOfFieldsMessage}</Body>

      <Body as="div">
        <dl>
          <dt>Array lengths</dt>
          <dd>
            <ul>
              <li>min: {minLength}</li>
              <li>average: {averageLength}</li>
              <li>max: {maxLength}</li>
            </ul>
          </dd>
        </dl>
      </Body>
    </>
  );
}

export default ArrayMinichart;
