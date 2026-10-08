import React from 'react';
import {
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  useId,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { DocumentView } from '../stores/crud-store';

type ViewSwitcherProps = {
  activeView: DocumentView;
  onChange: (value: DocumentView) => void;
};

const ViewSwitcher = ({ activeView, onChange }: ViewSwitcherProps) => {
  const controlId = useId();
  const t = useTranslation();
  return (
    <SegmentedControl
      id={controlId}
      aria-label={t('crud.viewSwitcher.view', 'View')}
      size="xsmall"
      value={activeView}
      onChange={(value) => onChange(value as DocumentView)}
    >
      <SegmentedControlOption
        data-testid="toolbar-view-list"
        aria-label={t('crud.viewSwitcher.list', 'Document list')}
        value="List"
        glyph={<Icon glyph="Menu" />}
      />
      <SegmentedControlOption
        data-testid="toolbar-view-json"
        aria-label={t('crud.viewSwitcher.json', 'E-JSON View')}
        value="JSON"
        glyph={<Icon glyph="CurlyBraces" />}
      />
      <SegmentedControlOption
        data-testid="toolbar-view-table"
        aria-label={t('crud.viewSwitcher.table', 'Table View')}
        value="Table"
        glyph={<Icon glyph="Table" />}
      />
    </SegmentedControl>
  );
};

export { ViewSwitcher };
