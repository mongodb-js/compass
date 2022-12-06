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

export type ViewType = 'grid' | 'list';

const VIEW_TYPE_SETTINGS_KEY = 'compass_items_grid_view_type';

function getViewTypeSettingsFromSessionStorage(
  defaultType: ViewType = 'grid'
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
  gap: spacing[2],
});

const label = css({
  // Because leafygreen
  margin: '0 !important',
  padding: '0 !important',
});

export function useViewTypeControls({
  defaultViewType = 'list',
  onChange = () => {
    // noop
  },
}: {
  defaultViewType?: ViewType;
  onChange?: (newType: ViewType) => void;
}): [React.ReactElement, ViewType] {
  const [viewType, setViewType] = useState<ViewType>(() =>
    getViewTypeSettingsFromSessionStorage(defaultViewType)
  );
  useEffect(() => {
    setViewTypeSettingsFromSessionStorage(viewType);
  }, [viewType]);
  const onViewTypeChange = useCallback(
    (val: ViewType) => {
      onChange(val);
      setViewType(val);
    },
    [onChange]
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
          onChange={onViewTypeChange as (newValue: string) => void}
        >
          <SegmentedControlOption
            value="list"
            glyph={<Icon glyph="Menu"></Icon>}
          />
          <SegmentedControlOption
            value="grid"
            glyph={<Icon glyph="Apps"></Icon>}
          />
        </SegmentedControl>
      </div>
    );
  }, [labelId, controlId, viewType, onViewTypeChange]);
  return [viewControls, viewType];
}
