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
  uiColors,
  withTheme,
} from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

const toolbarStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
});

const titleStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const titleStylesDark = css({
  color: uiColors.green.light2,
});

const titleStylesLight = css({
  color: uiColors.green.dark2,
});

const toolbarActionStyles = css({
  overflow: 'hidden',
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
  namespace: {
    ns: string;
  };
  darkMode?: boolean;
  onClose?: () => void;
  showing: 'recent' | 'favorites';
};

function UnthemedToolbar({
  actions,
  darkMode,
  namespace,
  showing,
  onClose,
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

  const onCollapse = useCallback(() => {
    actions.collapse();
  }, [actions]);

  // TODO(COMPASS-5679): After we enable the feature flag,
  // we can remove the collapsed handler and make `onClose` default required.
  const onClickClose = useCallback(() => {
    track('Query History Closed');
    onClose?.();
  }, [onClose]);

  const labelId = useId();
  const controlId = useId();

  return (
    <CompassComponentsToolbar className={toolbarStyles}>
      <div className={toolbarActionStyles}>
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
      <IconButton
        className={closeButtonStyles}
        data-testid="query-history-button-close-panel"
        onClick={onClose ? onClickClose : onCollapse}
        aria-label="Close query history"
      >
        <Icon glyph="X" />
      </IconButton>
    </CompassComponentsToolbar>
  );
}

const Toolbar = withTheme(UnthemedToolbar);

export { Toolbar };
