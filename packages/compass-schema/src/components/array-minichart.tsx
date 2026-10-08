import React from 'react';
import numeral from 'numeral';
import { Body, useTranslation } from '@mongodb-js/compass-components';

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
  const t = useTranslation();
  let arrayOfFieldsMessage = '';
  if (nestedDocType) {
    const numFields = nestedDocType.fields?.length ?? 0;
    arrayOfFieldsMessage =
      numFields === 1
        ? t(
            'schema.arrayMinichart.nestedFieldOne',
            'Array of documents with {count} nested field.',
            { count: numFields }
          )
        : t(
            'schema.arrayMinichart.nestedFieldOther',
            'Array of documents with {count} nested fields.',
            { count: numFields }
          );
  }

  const minLength = Math.min(...type.lengths);
  const averageLength = numeral(type.averageLength).format('0.0[0]');
  const maxLength = Math.max(...type.lengths);

  return (
    <>
      <Body>{arrayOfFieldsMessage}</Body>

      <Body as="div">
        <dl>
          <dt>{t('schema.arrayMinichart.arrayLengths', 'Array lengths')}</dt>
          <dd>
            <ul>
              <li>
                {t('schema.arrayMinichart.min', 'min')}: {minLength}
              </li>
              <li>
                {t('schema.arrayMinichart.average', 'average')}: {averageLength}
              </li>
              <li>
                {t('schema.arrayMinichart.max', 'max')}: {maxLength}
              </li>
            </ul>
          </dd>
        </dl>
      </Body>
    </>
  );
}

export default ArrayMinichart;
