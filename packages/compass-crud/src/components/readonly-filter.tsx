import React from 'react';

import {
  InfoSprinkle,
  Label,
  css,
  spacing,
  KeylineCard,
  fontFamilies,
} from '@mongodb-js/compass-components';

type QueryLabelProps = {
  tooltip: string;
  label: string;
};

const queryLabelStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const QueryLabel: React.FunctionComponent<QueryLabelProps> = ({
  tooltip,
  label,
}) => {
  return (
    <div className={queryLabelStyles}>
      <Label htmlFor="readonly-filter">{label}</Label>
      <InfoSprinkle align="right">{tooltip}</InfoSprinkle>
    </div>
  );
};

const readOnlyFilterStyles = css({
  padding: spacing[2],
  overflow: 'scroll',
  width: '100%',
  whiteSpace: 'nowrap',
  fontFamily: fontFamilies.code,
  '::-webkit-scrollbar': {
    display: 'none',
  },
});

type ReadonlyFilterProps = {
  queryLabel: string;
  filterQuery: string;
};

export function ReadonlyFilter({
  queryLabel,
  filterQuery,
}: ReadonlyFilterProps) {
  return (
    <>
      <QueryLabel
        label={queryLabel}
        tooltip="Return to the Documents tab to edit this query."
      />
      <KeylineCard
        id="readonly-filter"
        data-testid="readonly-filter"
        disabled={true}
        className={readOnlyFilterStyles}
      >
        <code>{filterQuery}</code>
      </KeylineCard>
    </>
  );
}
