import React from 'react';
import {
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  useId,
} from '@mongodb-js/compass-components';
import type { DocumentView } from '../stores/crud-store';

type ViewSwitcherProps = {
  activeView: DocumentView;
  onChange: (value: DocumentView) => void;
};

const ViewSwitcher = ({ activeView, onChange }: ViewSwitcherProps) => {
  const controlId = useId();
  return (
    <SegmentedControl
      id={controlId}
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
  );
};

export { ViewSwitcher };
