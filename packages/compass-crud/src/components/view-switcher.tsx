import React from 'react';
import {
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  useId,
  GuideCue,
} from '@mongodb-js/compass-components';
import type { DocumentView } from '../stores/crud-store';

type ViewSwitcherProps = {
  activeView: DocumentView;
  onChange: (value: DocumentView) => void;
};

const ViewSwitcher = ({ activeView, onChange }: ViewSwitcherProps) => {
  const controlId = useId();
  return (
    <GuideCue<HTMLDivElement>
      cueId="document-view-switcher"
      title="View your documents your preferred way"
      description="Toggle between a list view, JSON view, and table view."
      trigger={({ ref }) => (
        <SegmentedControl
          id={controlId}
          ref={ref}
          aria-label="View"
          size="small"
          value={activeView}
          onChange={(value) => onChange(value as DocumentView)}
        >
          <SegmentedControlOption
            data-testid="toolbar-view-list"
            aria-label="Document list"
            value="List"
            glyph={<Icon glyph="Menu" />}
          />
          <SegmentedControlOption
            data-testid="toolbar-view-json"
            aria-label="E-JSON View"
            value="JSON"
            glyph={<Icon glyph="CurlyBraces" />}
          />
          <SegmentedControlOption
            data-testid="toolbar-view-table"
            aria-label="Table View"
            value="Table"
            glyph={<Icon glyph="Table" />}
          />
        </SegmentedControl>
      )}
    />
  );
};

export { ViewSwitcher };
