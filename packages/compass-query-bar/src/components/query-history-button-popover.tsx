import React, { useCallback, useRef, useState } from 'react';
import {
  Icon,
  InteractivePopover,
  css,
  cx,
  focusRing,
  spacing,
} from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type AppRegistry from 'hadron-app-registry';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

const openQueryHistoryButtonStyles = cx(
  css({
    border: 'none',
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    padding: spacing[2] - 2, // -2px for border.
    '&:hover': {
      cursor: 'pointer',
    },
  }),
  focusRing
);

const queryHistoryPopoverStyles = css({
  // We want the popover to open almost to the shell at the bottom of Compass.
  maxHeight: 'calc(100vh - 270px)',
  marginTop: spacing[1],
  display: 'flex',
  marginLeft: -spacing[2] - 1, // Align to the left of the query bar.
});

type QueryHistoryProps = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
};

export const QueryHistoryButtonPopover: React.FunctionComponent<
  QueryHistoryProps
> = ({ globalAppRegistry, localAppRegistry }) => {
  const queryHistoryRef = useRef<{
    component?: React.ComponentType<any>;
    store: any; // Query history store is not currently typed.
    actions: any; // Query history actions are not typed.
  }>({
    component: globalAppRegistry.getRole('Query.QueryHistory')?.[0].component,
    store: localAppRegistry.getStore('Query.History'),
    actions: localAppRegistry.getAction('Query.History.Actions'),
  });
  const [showQueryHistory, setShowQueryHistory] = useState(false);

  const onSetShowQueryHistory = useCallback(
    (newShowQueryHistory: boolean) => {
      if (newShowQueryHistory) {
        track('Query History Opened');
      }

      setShowQueryHistory(newShowQueryHistory);
    },
    [setShowQueryHistory]
  );

  const QueryHistoryComponent = queryHistoryRef.current.component;

  if (!QueryHistoryComponent) {
    return null;
  }

  const popoverContent = ({ onClose }: { onClose: () => void }) => (
    <QueryHistoryComponent
      onClose={onClose}
      store={queryHistoryRef.current?.store}
      actions={queryHistoryRef.current?.actions}
    />
  );

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
      {popoverContent}
    </InteractivePopover>
  );
};
