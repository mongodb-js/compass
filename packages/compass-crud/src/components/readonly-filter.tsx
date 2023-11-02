import React from 'react';

import {
  TextInput,
  InfoSprinkle,
  Button,
  Icon,
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

const queryBarStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[3],
});

const textInputStyles = css({
  input: {
    fontFamily: fontFamilies.code,
  },
  width: '100%',
});

const exportToLanguageButtonStyles = css({
  alignSelf: 'end',
});

type ReadonlyFilterProps = {
  queryLabel: string;
  filterQuery: string;
  onExportToLanguage: () => void;
};

export function ReadonlyFilter({
  queryLabel,
  filterQuery,
  onExportToLanguage,
}: ReadonlyFilterProps) {
  return (
    <div className={queryBarStyles}>
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
      <Button
        className={exportToLanguageButtonStyles}
        variant="primaryOutline"
        size="default"
        leftGlyph={<Icon glyph="Code" />}
        onClick={onExportToLanguage}
        data-testid="pipeline-toolbar-export-button"
      >
        Export
      </Button>
    </div>
  );
}
