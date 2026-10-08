import React, { useEffect, useRef } from 'react';
import {
  Accordion,
  Banner,
  Link,
  Radio,
  RadioGroup,
  css,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';

import type { ExportJSONFormat } from '../export/export-json';

const radioGroupStyles = css({
  margin: `${spacing[400]}px 0`,
});

const bannerContainerStyles = css({
  margin: `${spacing[200]}px 0`,
});

function JSONFileTypeOptions({
  jsonFormat,
  setJSONFormatVariant,
}: {
  jsonFormat: ExportJSONFormat;
  setJSONFormatVariant: (jsonFormatVariant: ExportJSONFormat) => void;
}) {
  const t = useTranslation();
  const exampleLabel = t('importExport.jsonFormat.example', 'Example:');
  const relaxedWarningBannerContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // When the user selects relaxed we scroll to show the warning at the bottom.
    if (jsonFormat === 'relaxed') {
      relaxedWarningBannerContainerRef.current?.scrollIntoView();
    }
  }, [jsonFormat]);

  return (
    <Accordion
      text={t('importExport.jsonFormat.advanced', 'Advanced JSON Format')}
      data-testid="export-advanced-json-format"
    >
      <RadioGroup
        className={radioGroupStyles}
        data-testid="export-json-format-options"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setJSONFormatVariant(event.target.value as ExportJSONFormat)
        }
      >
        <Radio
          value="default"
          checked={jsonFormat === 'default'}
          description={`${exampleLabel}  { "fortyTwo": 42, "oneHalf": 0.5, "bignumber": { "$numberLong": "5000000000" } }`}
        >
          {t('importExport.jsonFormat.default', 'Default Extended JSON')}
        </Radio>
        <Radio
          value="relaxed"
          checked={jsonFormat === 'relaxed'}
          description={`${exampleLabel} { "fortyTwo": 42, "oneHalf": 0.5, "bignumber": 5000000000 }. ${t(
            'importExport.jsonFormat.relaxedNote',
            'Large numbers (>= 2^^53) will change with this format.'
          )}`}
        >
          {t('importExport.jsonFormat.relaxed', 'Relaxed Extended JSON')}
        </Radio>
        <Radio
          value="canonical"
          data-testid="export-json-format-canonical"
          checked={jsonFormat === 'canonical'}
          description={`${exampleLabel} { "fortyTwo": { "$numberInt": "42" }, "oneHalf": { "$numberDouble": "0.5" }, "bignumber": { "$numberLong": "5000000000" } }`}
        >
          {t('importExport.jsonFormat.canonical', 'Canonical Extended JSON')}
        </Radio>
      </RadioGroup>
      {/* TODO(COMPASS-6632): Add docs link */}
      <Link
        href="https://www.mongodb.com/docs/compass/current/import-export/"
        target="_blank"
      >
        {t('importExport.jsonFormat.learnMore', 'Learn more about JSON format')}
      </Link>
      <div
        className={bannerContainerStyles}
        ref={relaxedWarningBannerContainerRef}
      >
        {jsonFormat === 'relaxed' && (
          <Banner variant="warning">
            {t(
              'importExport.jsonFormat.relaxedWarning',
              'Large numbers (>= 2^^53) will lose precision with the relaxed EJSON format. This format is not recommended for data integrity.'
            )}
          </Banner>
        )}
      </div>
    </Accordion>
  );
}

export { JSONFileTypeOptions };
