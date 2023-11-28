import React from 'react';

import {
  InfoSprinkle,
  Label,
  css,
  spacing,
  KeylineCard,
  fontFamilies,
  useId,
} from '@mongodb-js/compass-components';

const queryLabelStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const readOnlyFilterStyles = css({
  padding: spacing[2],
  overflow: 'scroll',
  width: '100%',
  whiteSpace: 'nowrap',
  display: 'inline-block',
  verticalAlign: 'middle',
  lineHeight: `${spacing[3] + 2}px`,
  '::-webkit-scrollbar': {
    display: 'none',
  },
});

const codeStyles = css({
  fontSize: 14,
  fontFamily: fontFamilies.code,
});

type ReadonlyFilterProps = {
  queryLabel: string;
  filterQuery: string;
};

export function ReadonlyFilter({
  queryLabel,
  filterQuery,
}: ReadonlyFilterProps) {
  const readOnlyFilterId = useId();
  return (
    <>
      <div className={queryLabelStyles}>
        <Label htmlFor={readOnlyFilterId}>{queryLabel}</Label>
        <InfoSprinkle align="right">
          Return to the Documents tab to edit this query.
        </InfoSprinkle>
      </div>
      <KeylineCard
        id={readOnlyFilterId}
        data-testid="readonly-filter"
        className={readOnlyFilterStyles}
      >
        <code className={codeStyles}>{filterQuery}</code>
      </KeylineCard>
    </>
  );
}
