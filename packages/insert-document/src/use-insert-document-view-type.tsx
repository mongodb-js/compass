import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SegmentedControl,
  SegmentedControlOption,
  Icon,
  Label,
  css,
  spacing,
  useId,
} from '@mongodb-js/compass-components';

export type ViewType = 'Shell' | 'EJSON' | 'List';

const VIEW_TYPE_SETTINGS_KEY = 'compass_insert_document_view_type';

function getViewTypeSettingsFromSessionStorage(
  defaultType: ViewType = 'Shell'
): ViewType {
  try {
    return (
      (window.sessionStorage.getItem(VIEW_TYPE_SETTINGS_KEY) as ViewType) ??
      defaultType
    );
  } catch {
    return defaultType;
  }
}

function setViewTypeSettingsFromSessionStorage(val: ViewType) {
  try {
    window.sessionStorage.setItem(VIEW_TYPE_SETTINGS_KEY, val);
  } catch {
    // noop
  }
}

const controlsContainer = css({
  display: 'flex',
  alignItems: 'center',
  marginTop: spacing[2],
  gap: spacing[2],
  justifyContent: 'flex-end',
});

const label = css({
  // Because leafygreen
  margin: '0 !important',
  padding: '0 !important',
});

export function useInsertDocumentViewTypeControls({
  defaultViewType = 'Shell',
  onChange = () => {
    // noop
  },
}: {
  defaultViewType?: ViewType;
  onChange?: (currentViewType: ViewType, newType: ViewType) => void;
}): [React.ReactElement, ViewType] {
  const [viewType, setViewType] = useState<ViewType>(() =>
    getViewTypeSettingsFromSessionStorage(defaultViewType)
  );
  useEffect(() => {
    setViewTypeSettingsFromSessionStorage(viewType);
  }, [viewType]);
  const onViewTypeChange = useCallback(
    (val: ViewType) => {
      onChange(viewType, val);
      setViewType(val);
    },
    [viewType, onChange]
  );
  const labelId = useId();
  const controlId = useId();
  const viewControls = useMemo(() => {
    return (
      <div className={controlsContainer}>
        <Label id={labelId} htmlFor={controlId} className={label}>
          View
        </Label>
        <SegmentedControl
          id={controlId}
          aria-labelledby={labelId}
          value={viewType}
          size="small"
          onChange={onViewTypeChange as (newValue: string) => void}
        >
          <SegmentedControlOption
            data-testid="insert-document-modal-view-shell"
            aria-label="Shell JS View"
            title="Shell JS View"
            value="Shell"
            glyph={<Icon glyph="Code"></Icon>}
          />
          <SegmentedControlOption
            value="EJSON"
            data-testid="insert-document-modal-view-ejson"
            aria-label="E-JSON View"
            title="E-JSON View"
            glyph={<Icon glyph="CurlyBraces"></Icon>}
          />
          <SegmentedControlOption
            value="List"
            aria-label="Document List View"
            title="Document List View"
            data-testid="insert-document-modal-view-list"
            glyph={<Icon glyph="Menu"></Icon>}
          />
        </SegmentedControl>
      </div>
    );
  }, [labelId, controlId, viewType, onViewTypeChange]);
  return [viewControls, viewType];
}
