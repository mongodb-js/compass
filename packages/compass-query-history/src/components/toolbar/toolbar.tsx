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
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

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
  onClose: () => void;
  showing: 'recent' | 'favorites';
  showFavorites: () => void;
  showRecent: () => void;
};

const Toolbar: React.FunctionComponent<ToolbarProps> = ({
  onClose,
  showing,
  showRecent,
  showFavorites,
}) => {
  const onViewSwitch = useCallback(
    (label: 'recent' | 'favorites') => {
      if (label === 'recent') {
        showRecent();
      } else if (label === 'favorites') {
        showFavorites();
      }
    },
    [showRecent, showFavorites]
  );

  const onClickClose = useCallback(() => {
    track('Query History Closed');
    onClose();
  }, [onClose]);

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
        onClick={onClickClose}
        aria-label="Close query history"
      >
        <Icon glyph="X" />
      </IconButton>
    </CompassComponentsToolbar>
  );
};

export { Toolbar };
