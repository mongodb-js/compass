import React from 'react';
import {
  Label,
  SegmentedControl,
  SegmentedControlOption,
  css,
  spacing,
  useId,
  palette,
  Icon,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { QueryHistoryTab } from '..';

const titleStyles = css({
  display: 'block',
  flexShrink: 0,
  fontSize: '16px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  lineHeight: `${spacing[4]}px`,
  marginBottom: spacing[3],
});

const titleStylesDark = css({
  color: palette.green.light2,
});

const titleStylesLight = css({
  color: palette.green.dark2,
});

const toolbarStyles = css({
  padding: spacing[3],
  paddingBottom: 0, // each item has top margin
  paddingRight: spacing[5], // Extra right padding to account for close button.
});

const viewSwitcherStyles = css({
  marginTop: spacing[1],
});

type ToolbarProps = {
  tab: QueryHistoryTab;
  onChange: (tab: QueryHistoryTab) => void;
  namespace: string;
};

function Toolbar({
  tab,
  onChange,
  namespace,
}: ToolbarProps): React.ReactElement {
  const darkMode = useDarkMode();

  const labelId = useId();
  const controlId = useId();

  return (
    <div className={toolbarStyles}>
      <Label className={titleStyles} id={labelId} htmlFor={controlId}>
        Queries in{' '}
        <span
          className={darkMode ? titleStylesDark : titleStylesLight}
          title={namespace}
        >
          {namespace}
        </span>
      </Label>
      <SegmentedControl
        className={viewSwitcherStyles}
        id={controlId}
        aria-labelledby={labelId}
        value={tab}
        onChange={(value: string) => onChange(value as QueryHistoryTab)}
      >
        <SegmentedControlOption
          aria-controls="recent"
          value="recent"
          data-testid="past-queries-recent"
          glyph={<Icon glyph="Clock" />}
        >
          Recents
        </SegmentedControlOption>
        <SegmentedControlOption
          aria-controls="favorite"
          value="favorite"
          data-testid="past-queries-favorites"
          glyph={<Icon glyph="Favorite" />}
        >
          Favorites
        </SegmentedControlOption>
      </SegmentedControl>
    </div>
  );
}

export { Toolbar };
