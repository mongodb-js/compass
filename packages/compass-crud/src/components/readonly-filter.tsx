import React from 'react';

import {
  TextInput,
  InfoSprinkle,
  Label,
  css,
  spacing,
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
  height: '17px', // align with the Preview label
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

const textInputStyles = css({
  input: {
    fontFamily: fontFamilies.code,
  },
  width: '100%',
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
    <TextInput
      id="readonly-filter"
      data-testid="readonly-filter"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore the label can be any component, but it's weirdly typed to string
      label={
        <QueryLabel
          label={queryLabel}
          tooltip="Return to the Documents tab to edit this query."
        />
      }
      disabled={true}
      value={filterQuery}
      className={textInputStyles}
    />
  );
}
