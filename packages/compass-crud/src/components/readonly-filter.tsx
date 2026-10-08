import React from 'react';

import {
  InfoSprinkle,
  Label,
  css,
  spacing,
  KeylineCard,
  fontFamilies,
  useId,
  useTranslation,
} from '@mongodb-js/compass-components';

const queryLabelStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'center',
});

const readOnlyFilterStyles = css({
  padding: spacing[200],
  overflow: 'scroll',
  width: '100%',
  whiteSpace: 'nowrap',
  display: 'inline-block',
  verticalAlign: 'middle',
  lineHeight: `${spacing[400] + 2}px`,
  '::-webkit-scrollbar': {
    display: 'none',
  },
});

const codeStyles = css({
  fontSize: 14,
  fontFamily: fontFamilies.code,
});

type ReadonlyFilterProps = {
  queryLabel?: string;
  filterQuery: string;
};

export function ReadonlyFilter({
  queryLabel,
  filterQuery,
}: ReadonlyFilterProps) {
  const t = useTranslation();
  const readOnlyFilterId = useId();
  return (
    <>
      <div className={queryLabelStyles}>
        <Label htmlFor={readOnlyFilterId}>
          {queryLabel ?? t('crud.readonlyFilter.filter', 'Filter')}
        </Label>
        <InfoSprinkle align="right">
          {t(
            'crud.readonlyFilter.returnToDocuments',
            'Return to the Documents tab to edit this query.'
          )}
        </InfoSprinkle>
      </div>
      <KeylineCard
        id={readOnlyFilterId}
        data-testid="readonly-filter"
        className={readOnlyFilterStyles}
      >
        <code className={codeStyles}>
          {filterQuery === '{}'
            ? t('crud.readonlyFilter.none', 'None')
            : filterQuery}
        </code>
      </KeylineCard>
    </>
  );
}
