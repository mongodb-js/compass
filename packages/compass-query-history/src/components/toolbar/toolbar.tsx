import React, { useCallback } from 'react';
import {
  Label,
  SegmentedControl,
  SegmentedControlOption,
  css,
  spacing,
  useId,
  palette,
  withTheme,
  Icon,
} from '@mongodb-js/compass-components';

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
  actions: {
    showRecent: () => void;
    showFavorites: () => void;
  }; // Query history actions are not currently typed.
  namespace: {
    ns: string;
  };
  darkMode?: boolean;
  showing: 'recent' | 'favorites';
};

function UnthemedToolbar({
  actions,
  darkMode,
  namespace,
  showing,
}: ToolbarProps): React.ReactElement {
  const onViewSwitch = useCallback(
    (label: 'recent' | 'favorites') => {
      if (label === 'recent') {
        actions.showRecent();
      } else if (label === 'favorites') {
        actions.showFavorites();
      }
    },
    [actions]
  );

  const labelId = useId();
  const controlId = useId();

  return (
    <div className={toolbarStyles}>
      <Label className={titleStyles} id={labelId} htmlFor={controlId}>
        Queries in{' '}
        <span
          className={darkMode ? titleStylesDark : titleStylesLight}
          title={namespace.ns}
        >
          {namespace.ns}
        </span>
      </Label>
      <SegmentedControl
        className={viewSwitcherStyles}
        id={controlId}
        aria-labelledby={labelId}
        value={showing}
        onChange={(value: string) =>
          onViewSwitch(value as 'recent' | 'favorites')
        }
      >
        <SegmentedControlOption
          value="recent"
          data-testid="past-queries-recent"
        >
          <Icon glyph="Clock" />
          Recents
        </SegmentedControlOption>
        <SegmentedControlOption
          value="favorites"
          data-testid="past-queries-favorites"
        >
          <Icon glyph="Favorite" />
          Favorites
        </SegmentedControlOption>
      </SegmentedControl>
    </div>
  );
}

const Toolbar = withTheme(UnthemedToolbar);

export { Toolbar };
