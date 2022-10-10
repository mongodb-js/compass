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
} from '@mongodb-js/compass-components';

const titleStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const titleStylesDark = css({
  color: palette.green.light2,
});

const titleStylesLight = css({
  color: palette.green.dark2,
});

const toolbarStyles = css({
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[3],
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
          Recents
        </SegmentedControlOption>
        <SegmentedControlOption
          value="favorites"
          data-testid="past-queries-favorites"
        >
          Favorites
        </SegmentedControlOption>
      </SegmentedControl>
    </div>
  );
}

const Toolbar = withTheme(UnthemedToolbar);

export { Toolbar };
