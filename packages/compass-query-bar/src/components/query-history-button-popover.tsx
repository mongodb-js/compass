import React, { useCallback, useRef, useState } from 'react';
import {
  Icon,
  Popover,
  css,
  cx,
  focusRingStyles,
  focusRingVisibleStyles,
  spacing,
  useOnClickOutside,
} from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type AppRegistry from 'hadron-app-registry';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

const openQueryHistoryStyles = cx(
  css({
    border: 'none',
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    padding: spacing[2] - 2, // -2px for border.
    '&:hover': {
      cursor: 'pointer',
    },
    '&:focus': focusRingVisibleStyles,
  }),
  focusRingStyles
);

const queryHistoryContainerStyles = css({
  display: 'flex',
  height: '100%',
});

const queryHistoryPopoverStyles = css({
  // We want the popover to open almost to the shell at the bottom of Compass.
  maxHeight: 'calc(100vh - 270px)',
  display: 'flex',
  marginLeft: -spacing[4], // Align to the left of the query bar.
});

type QueryHistoryProps = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
};

export const QueryHistoryButtonPopover: React.FunctionComponent<
  QueryHistoryProps
> = ({ globalAppRegistry, localAppRegistry }) => {
  const queryHistoryRef = useRef<{
    component: React.ComponentType<any>;
    store: any; // Query history store is not currently typed.
    actions: any; // Query history actions are not typed.
  }>({
    component: globalAppRegistry.getRole('Query.QueryHistory')![0].component,
    store: localAppRegistry.getStore('Query.History'),
    actions: localAppRegistry.getAction('Query.History.Actions'),
  });
  const queryHistoryButtonRef = useRef<HTMLButtonElement>(null);
  const queryHistoryContainerRef = useRef<HTMLDivElement>(null);

  const [showQueryHistory, setShowQueryHistory] = useState(false);

  const onClickQueryHistory = useCallback(() => {
    if (!showQueryHistory) {
      track('Query History Opened');
    }

    setShowQueryHistory(!showQueryHistory);
  }, [showQueryHistory, setShowQueryHistory]);

  const onClickOutsideQueryHistory = useCallback(
    (event) => {
      // Ignore clicks on the query history button as it has its own handler.
      if (
        !queryHistoryButtonRef.current ||
        queryHistoryButtonRef.current.contains(event.target as Node)
      ) {
        return;
      }
      setShowQueryHistory(false);
    },
    [queryHistoryButtonRef, setShowQueryHistory]
  );

  useOnClickOutside(queryHistoryContainerRef, onClickOutsideQueryHistory);

  const onHideQueryHistory = useCallback(() => {
    setShowQueryHistory(false);
  }, [setShowQueryHistory]);

  const QueryHistoryComponent = queryHistoryRef.current?.component;

  return (
    <>
      <button
        data-testid="query-history-button"
        onClick={onClickQueryHistory}
        className={openQueryHistoryStyles}
        id="open-query-history"
        aria-label="Open query history"
        type="button"
        ref={queryHistoryButtonRef}
      >
        <Icon glyph="Clock" />
        <Icon glyph="CaretDown" />
      </button>
      <Popover
        align="bottom"
        justify="start"
        active={showQueryHistory}
        usePortal
        adjustOnMutation
        spacing={0}
        popoverZIndex={99999}
        className={queryHistoryPopoverStyles}
        refEl={queryHistoryButtonRef}
      >
        <div
          className={queryHistoryContainerStyles}
          ref={queryHistoryContainerRef}
        >
          {QueryHistoryComponent && (
            <QueryHistoryComponent
              onClose={onHideQueryHistory}
              store={queryHistoryRef.current?.store}
              actions={queryHistoryRef.current?.actions}
            />
          )}
        </div>
      </Popover>
    </>
  );
};
