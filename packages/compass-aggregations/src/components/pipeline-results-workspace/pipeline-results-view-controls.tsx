import React from 'react';
import {
  css,
  SegmentedControl,
  SegmentedControlOption,
  Overline,
  Icon,
  spacing,
  useId,
} from '@mongodb-js/compass-components';

import type { ResultsViewType } from './pipeline-results-list';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  flex: 'none',
});

const segmentedControlOptionStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
});

const PipelineResultsViewControls: React.FunctionComponent<{
  value: ResultsViewType;
  onChange(viewType: ResultsViewType): void;
}> = ({ value, onChange }) => {
  const labelId = useId();
  const controlId = useId();
  return (
    <div
      className={containerStyles}
      data-testid="pipeline-results-view-controls"
    >
      <Overline
        as="label"
        id={labelId}
        htmlFor={controlId}
        aria-label="Show documents as"
      >
        View
      </Overline>
      <SegmentedControl
        id={controlId}
        aria-labelledby={labelId}
        size="small"
        value={value}
        onChange={onChange as (newValue: string) => void}
      >
        <SegmentedControlOption aria-label="Document list" value="document">
          <div className={segmentedControlOptionStyles}>
            <Icon size="small" glyph="Menu"></Icon>
          </div>
        </SegmentedControlOption>
        <SegmentedControlOption aria-label="JSON list" value="json">
          <div className={segmentedControlOptionStyles}>
            <Icon size="small" glyph="CurlyBraces"></Icon>
          </div>
        </SegmentedControlOption>
      </SegmentedControl>
    </div>
  );
};

export default PipelineResultsViewControls;
