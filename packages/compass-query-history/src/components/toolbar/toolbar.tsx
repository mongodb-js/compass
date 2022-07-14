import React, { useCallback } from 'react';
import {
  Icon,
  IconButton,
  Label,
  SegmentedControl,
  SegmentedControlOption,
  Toolbar as CompassComponentsToolbar,
  css,
  spacing,
  useId,
} from '@mongodb-js/compass-components';

const toolbarStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
});

const toolbarActionStyles = css({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[3],
});

const viewSwitcherStyles = css({
  marginTop: spacing[1],
});

const closeButtonStyles = css({
  marginLeft: 'auto',
  marginTop: spacing[2],
  marginRight: spacing[2],
});

type ToolbarProps = {
  actions: {
    showRecent: () => void;
    showFavorites: () => void;
    collapse: () => void;
  }; // Query history actions are not currently typed.
  showing: 'recent' | 'favorites';
};

const Toolbar: React.FunctionComponent<ToolbarProps> = ({
  actions,
  showing,
}) => {
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

  const onCollapse = useCallback(() => {
    actions.collapse();
  }, [actions]);

  const labelId = useId();
  const controlId = useId();

  return (
    <CompassComponentsToolbar className={toolbarStyles}>
      <div className={toolbarActionStyles}>
        <Label id={labelId} htmlFor={controlId}>
          Queries
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
      <IconButton
        className={closeButtonStyles}
        data-testid="query-history-button-close-panel"
        onClick={onCollapse}
        aria-label="Close query history"
      >
        <Icon glyph="X" />
      </IconButton>
    </CompassComponentsToolbar>
  );
};

export { Toolbar };
