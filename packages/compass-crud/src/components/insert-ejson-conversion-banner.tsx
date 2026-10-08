import React, { useMemo, useState } from 'react';
import {
  Banner,
  BannerVariant,
  Button,
  Link,
  css,
  cx,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';
import { getAccidentalEJSONKey } from '../utils/ejson-conversion';
import {
  bannerActionContainerStyles,
  bannerMessageStyles,
  bannerStyles,
} from './insert-document-dialog-banner';

const errorStyles = css({ marginTop: spacing[200] });

export type InsertEJSONConversionBannerProps = {
  parsedEditorText: unknown;
  conversionError: string | null;
  onConvert: () => void;
};

function InsertEJSONConversionBanner({
  parsedEditorText,
  conversionError,
  onConvert,
}: InsertEJSONConversionBannerProps) {
  const t = useTranslation();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const accidentalEJSON = useMemo(
    () => getAccidentalEJSONKey(parsedEditorText),
    [parsedEditorText]
  );

  if (!accidentalEJSON || accidentalEJSON.key === dismissedKey) {
    return null;
  }

  const { key, shellEquivalent } = accidentalEJSON;

  return (
    <Banner
      data-testid="insert-document-ejson-conversion-banner"
      variant={BannerVariant.Danger}
      className={bannerStyles}
      dismissible
      onClose={() => setDismissedKey(key)}
    >
      <div>
        {t(
          'crud.ejsonBanner.containsKeys',
          'This document contains keys such as'
        )}{' '}
        <code>{key}</code>{' '}
        {t(
          'crud.ejsonBanner.indicate',
          'which indicate that this document is supposed to be in'
        )}{' '}
        <Link href="https://www.mongodb.com/docs/manual/reference/mongodb-extended-json/">
          {t('crud.ejsonBanner.extendedJson', 'Extended JSON')}
        </Link>{' '}
        {t(
          'crud.ejsonBanner.format',
          'format, which is a different format than this view accepts.'
        )}
      </div>
      <div>
        {t(
          'crud.ejsonBanner.convertQuestion',
          'Do you want to convert this text to Shell Syntax (e.g.'
        )}{' '}
        <code>{shellEquivalent}</code>{' '}
        {t('crud.ejsonBanner.instead', 'instead of')} <code>{key}</code>)?
      </div>
      <div className={bannerActionContainerStyles}>
        <Button
          size="xsmall"
          onClick={onConvert}
          data-testid="insert-document-ejson-conversion-button"
        >
          {t('crud.ejsonBanner.convert', 'Convert')}
        </Button>
      </div>
      {conversionError && (
        <div
          className={cx(errorStyles, bannerMessageStyles)}
          data-testid="insert-document-ejson-conversion-error"
        >
          {t(
            'crud.ejsonBanner.conversionFailed',
            'The document could not be converted:'
          )}{' '}
          {conversionError}
        </div>
      )}
    </Banner>
  );
}

export default InsertEJSONConversionBanner;
