import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Icon,
  Label,
  MoreOptionsToggle,
  Popover,
  css,
  cx,
  focusRingStyles,
  focusRingVisibleStyles,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import type AppRegistry from 'hadron-app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

const queryBarStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  padding: spacing[2],
  border: `1px solid ${uiColors.gray.light2}`,
  borderRadius: '6px',
});

const queryAreaStyles = css({
  flexGrow: 1,
});

const openQueryHistoryLabelStyles = css({
  display: 'inline-block',
  padding: 0,
});

const queryHistoryContainerStyles = css({
  display: 'flex',
  height: '100%',
});

const queryHistoryPopoverStyles = css({
  maxHeight: 'calc(100vh - 260px)',
  display: 'flex',
});

const openQueryHistoryStyles = cx(
  css({
    border: 'none',
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[1]}px ${spacing[1]}px`,
    '&:hover': {
      cursor: 'pointer',
    },
    '&:focus': focusRingVisibleStyles,
  }),
  focusRingStyles
);

function useOnClickOutside(
  ref: React.RefObject<HTMLDivElement>,
  buttonRef: React.RefObject<HTMLButtonElement>,
  useHook: boolean,
  handler: (event: Event) => void
) {
  useEffect(
    () => {
      if (useHook) {
        const listener: EventListener = (event) => {
          // Do nothing if clicking ref's element or descendent elements
          if (!ref.current || ref.current.contains(event.target)) {
            return;
          }
          if (!buttonRef.current || buttonRef.current.contains(event.target)) {
            return;
          }
          handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
          document.removeEventListener('mousedown', listener);
          document.removeEventListener('touchstart', listener);
        };
      }
    },
    // Add ref and handler to effect dependencies
    // It's worth noting that because passed in handler is a new ...
    // ... function on every render that will cause this effect ...
    // ... callback/cleanup to run every render. It's not a big deal ...
    // ... but to optimize you can wrap handler in useCallback before ...
    // ... passing it into this hook.
    [ref, buttonRef, handler, useHook]
  );
}

type QueryBarProps = {
  buttonLabel?: string;
  expanded: boolean;
  isQueryOptionsExpanded?: boolean;
  valid: boolean;
  queryState: 'apply' | 'reset';
  showQueryHistoryButton?: boolean;
  toggleExpandQueryOptions: () => void;
  toggleQueryHistory: () => void;
  store: {
    globalAppRegistry: AppRegistry;
    localAppRegistry: AppRegistry;
  };
};

export const QueryBar: React.FunctionComponent<QueryBarProps> = ({
  buttonLabel = 'Apply',
  expanded: isQueryOptionsExpanded = false,
  valid: isQueryValid,
  queryState,
  showQueryHistoryButton = true,
  toggleExpandQueryOptions,
  store,
}) => {
  const queryHistoryStore = store.localAppRegistry.getStore('Query.History');
  const queryHistoryActions = store.localAppRegistry.getAction(
    'Query.History.Actions'
  );
  // TODO: When `showQueryHistoryButton` is false let's assume this doesn't exist.
  const QueryHistoryComponent =
    store.globalAppRegistry.getRole('Query.QueryHistory')![0].component;

  const queryHistoryButtonRef = useRef<HTMLButtonElement>(null);

  const queryHistoryContainerRef = useRef<HTMLDivElement>(null);

  const [showQueryHistory, setShowQueryHistory] = useState(false);

  useOnClickOutside(
    queryHistoryContainerRef,
    queryHistoryButtonRef,
    showQueryHistory,
    () => setShowQueryHistory(false)
  );

  const onClickToggleQueryHistory = useCallback(() => {
    if (!showQueryHistory) {
      track('Query History Opened');
    }

    setShowQueryHistory(!showQueryHistory);
  }, [showQueryHistory, setShowQueryHistory]);

  return (
    <div className={queryBarStyles}>
      {showQueryHistoryButton && (
        <>
          <Label
            className={openQueryHistoryLabelStyles}
            htmlFor="open-query-history"
          >
            Query
          </Label>
          <button
            data-test-id="query-history-button"
            onClick={onClickToggleQueryHistory}
            className={openQueryHistoryStyles}
            id="open-query-history"
            aria-label="Open query history"
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
              <QueryHistoryComponent
                onClose={() => setShowQueryHistory(false)}
                store={queryHistoryStore}
                actions={queryHistoryActions}
              />
            </div>
          </Popover>
        </>
      )}
      <div className={queryAreaStyles}>Query Area (coming soon)</div>
      {isQueryOptionsExpanded && <div id="aria-controls">Query Options</div>}
      <Button
        data-test-id="query-bar-apply-filter-button"
        onClick={() => alert('coming soon')}
        disabled={!isQueryValid}
        variant="primary"
        size="small"
      >
        {buttonLabel}
      </Button>
      <Button
        aria-label="Reset query"
        data-test-id="query-bar-reset-filter-button"
        onClick={() => alert('coming soon')}
        disabled={queryState !== 'apply'}
        size="small"
      >
        Reset
      </Button>
      <MoreOptionsToggle
        aria-controls="query-options-container"
        data-testid="query-bar-options-toggle"
        isExpanded={isQueryOptionsExpanded}
        onToggleOptions={toggleExpandQueryOptions}
      />
    </div>
  );
};
