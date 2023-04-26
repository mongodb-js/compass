import React, { useCallback, useState } from 'react';
import {
  Icon,
  InteractivePopover,
  css,
  focusRing,
  spacing,
} from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { renderQueryHistoryComponent } from '../stores/query-bar-reducer';
import { connect } from 'react-redux';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

const openQueryHistoryButtonStyles = css(
  {
    border: 'none',
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    padding: spacing[2] - 2, // -2px for border.
    marginLeft: spacing[1],
    '&:hover': {
      cursor: 'pointer',
    },
  },
  focusRing
);

const queryHistoryPopoverStyles = css({
  // We want the popover to open almost to the shell at the bottom of Compass.
  maxHeight: 'calc(100vh - 270px)',
  marginTop: spacing[1],
  display: 'flex',
});

type QueryHistoryProps = {
  renderQueryHistoryComponent: () => React.ReactElement | null;
};

const QueryHistoryButtonPopover: React.FunctionComponent<QueryHistoryProps> = ({
  renderQueryHistoryComponent = () => null,
}) => {
  const [showQueryHistory, setShowQueryHistory] = useState(false);

  const onSetShowQueryHistory = useCallback(
    (newShowQueryHistory: boolean) => {
      if (newShowQueryHistory) {
        track('Query History Opened');
      } else {
        track('Query History Closed');
      }

      setShowQueryHistory(newShowQueryHistory);
    },
    [setShowQueryHistory]
  );

  const queryHistory = renderQueryHistoryComponent();

  if (!queryHistory) {
    return null;
  }

  return (
    <InteractivePopover
      className={queryHistoryPopoverStyles}
      trigger={({ onClick, ref, children }) => (
        <>
          <button
            data-testid="query-history-button"
            onClick={onClick}
            className={openQueryHistoryButtonStyles}
            aria-label="Open query history"
            aria-haspopup="true"
            title="Query History"
            tabIndex={0}
            aria-expanded={showQueryHistory ? true : undefined}
            type="button"
            ref={ref}
          >
            <Icon glyph="Clock" />
            <Icon glyph="CaretDown" />
          </button>
          {children}
        </>
      )}
      open={showQueryHistory}
      setOpen={onSetShowQueryHistory}
    >
      {queryHistory}
    </InteractivePopover>
  );
};

export default connect(null, { renderQueryHistoryComponent })(
  QueryHistoryButtonPopover
);
