import React from 'react';
import {
  css,
  SegmentedControl,
  SegmentedControlOption,
  Icon,
  spacing,
  useId,
} from '@mongodb-js/compass-components';

import type { ResultsViewType } from './pipeline-results-list';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  flex: 'none',
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
      <SegmentedControl
        id={controlId}
        aria-labelledby={labelId}
        size="xsmall"
        value={value}
        onChange={onChange as (newValue: string) => void}
      >
        <SegmentedControlOption
          aria-label="Document list"
          value="document"
          glyph={<Icon glyph="Menu"></Icon>}
        />
        <SegmentedControlOption
          aria-label="JSON list"
          value="json"
          glyph={<Icon glyph="CurlyBraces"></Icon>}
        />
      </SegmentedControl>
    </div>
  );
};

export default PipelineResultsViewControls;
