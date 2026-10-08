import React from 'react';
import { Tooltip, Body, useTranslation } from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';
import { translateToEnglish } from '../../utils/get-translate';

export const getUsageTooltip = (
  usage?: number,
  t: TranslateFn = translateToEnglish
): string => {
  return usage === null || usage === undefined
    ? t(
        'indexes.usageField.noStats',
        'Either the server does not support the $indexStats command or the user is not authorized to execute it.'
      )
    : t(
        'indexes.usageField.hits',
        '{usage} index hits since index creation or last server restart',
        { usage }
      );
};

type UsageFieldProps = {
  usage?: number;
  since?: Date;
};

const nbsp = '\u00a0';
const UsageField: React.FunctionComponent<UsageFieldProps> = ({
  usage,
  since,
}) => {
  const t = useTranslation();
  return (
    <Tooltip
      trigger={
        <Body>
          {usage === null || usage === undefined ? (
            t('indexes.usageField.unavailable', 'Usage data unavailable')
          ) : (
            <>
              {usage}
              {nbsp}
              {since
                ? t('indexes.usageField.since', '(since {date})', {
                    date: since.toDateString(),
                  })
                : ''}
            </>
          )}
        </Body>
      }
    >
      <Body>{getUsageTooltip(usage, t)}</Body>
    </Tooltip>
  );
};

export default UsageField;
