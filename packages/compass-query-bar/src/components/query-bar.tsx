import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Icon,
  IconButton,
  MoreOptionsToggle,
  Popover,
  css,
  cx,
  focusRingStyles,
  focusRingVisibleStyles,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type AppRegistry from 'hadron-app-registry';

import type {
  QueryOption,
  QueryBarOptionProps,
} from '../constants/query-option-definition';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import { QueryOption as QueryOptionComponent } from './query-option';
import { QueryOptionsGrid } from './query-options-grid';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

const queryBarFormStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  border: `1px solid ${uiColors.gray.light2}`,
  borderRadius: '6px',
  padding: spacing[1],
});

const queryBarFirstRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  padding: `0 ${spacing[2]}px`,
  margin: `0 ${spacing[1]}px`,
});

const filterContainerStyles = css({
  flexGrow: 1,
});

const openQueryHistoryStyles = cx(
  css({
    border: 'none',
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    padding: spacing[2],
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
  maxHeight: 'calc(100vh - 260px)',
  display: 'flex',
});

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
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  onApply: () => void;
  onChangeQueryOption: (queryOption: QueryOption, value: string) => void;
  onOpenExportToLanguage: () => void;
  onReset: () => void;
  queryOptions?: (
    | 'project'
    | 'sort'
    | 'collation'
    | 'skip'
    | 'limit'
    | 'maxTimeMS'
  )[];
  queryState: 'apply' | 'reset';
  refreshEditorAction: Listenable;
  schemaFields: string[];
  serverVersion: string;
  showExportToLanguageButton?: boolean;
  showQueryHistoryButton?: boolean;
  toggleExpandQueryOptions: () => void;
  valid: boolean;
} & QueryBarOptionProps;

export const QueryBar: React.FunctionComponent<QueryBarProps> = ({
  buttonLabel = 'Apply',
  expanded: isQueryOptionsExpanded = false,
  globalAppRegistry,
  localAppRegistry,
  onApply: _onApply,
  onChangeQueryOption,
  onOpenExportToLanguage,
  onReset,
  queryOptions = ['project', 'sort', 'collation', 'skip', 'limit', 'maxTimeMS'],
  queryState,
  refreshEditorAction,
  schemaFields,
  serverVersion,
  showExportToLanguageButton = true,
  showQueryHistoryButton = true,
  toggleExpandQueryOptions,
  valid: isQueryValid,
  ...queryOptionProps
}) => {
  const queryHistoryRef = useRef<{
    component: React.ComponentType<any>;
    store: any; // Query history store is not currently typed.
    actions: any; // Query history actions are not typed.
  } | null>(
    showQueryHistoryButton
      ? {
          component:
            globalAppRegistry.getRole('Query.QueryHistory')![0].component,
          store: localAppRegistry.getStore('Query.History'),
          actions: localAppRegistry.getAction('Query.History.Actions'),
        }
      : null
  );
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

  const onApply = useCallback(() => {
    if (isQueryValid) {
      _onApply();
    }
  }, [_onApply, isQueryValid]);

  const onFormSubmit = useCallback(
    (evt: React.FormEvent) => {
      evt.preventDefault();

      onApply();
    },
    [onApply]
  );

  const QueryHistoryComponent = queryHistoryRef.current?.component;

  return (
    <form className={queryBarFormStyles} onSubmit={onFormSubmit} noValidate>
      <div className={queryBarFirstRowStyles}>
        {showQueryHistoryButton && (
          <>
            <button
              data-testid="query-history-button"
              onClick={onClickToggleQueryHistory}
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
                    onClose={() => setShowQueryHistory(false)}
                    store={queryHistoryRef.current?.store}
                    actions={queryHistoryRef.current?.actions}
                  />
                )}
              </div>
            </Popover>
          </>
        )}
        <div className={filterContainerStyles}>
          <QueryOptionComponent
            hasError={!queryOptionProps.filterValid}
            queryOption="filter"
            onChange={(value: string) => onChangeQueryOption('filter', value)}
            onApply={onApply}
            placeholder={
              queryOptionProps.filterPlaceholder ||
              OPTION_DEFINITION.filter.placeholder
            }
            refreshEditorAction={refreshEditorAction}
            schemaFields={schemaFields}
            serverVersion={serverVersion}
            value={queryOptionProps.filterString}
          />
        </div>
        <Button
          aria-label="Reset query"
          data-testid="query-bar-reset-filter-button"
          onClick={onReset}
          disabled={queryState !== 'apply'}
          size="small"
          type="button"
        >
          Reset
        </Button>
        <Button
          data-testid="query-bar-apply-filter-button"
          disabled={!isQueryValid}
          variant="primary"
          size="small"
          type="submit"
        >
          {buttonLabel}
        </Button>
        {showExportToLanguageButton && (
          <IconButton
            onClick={onOpenExportToLanguage}
            title="Open export to language"
            aria-label="Open export to language"
            data-testid="query-bar-open-export-to-language-button"
            type="button"
          >
            <Icon glyph="Export" />
          </IconButton>
        )}

        {queryOptions && queryOptions.length > 0 && (
          <MoreOptionsToggle
            aria-controls="additional-query-options-container"
            data-testid="query-bar-options-toggle"
            isExpanded={isQueryOptionsExpanded}
            onToggleOptions={toggleExpandQueryOptions}
          />
        )}
      </div>
      {queryOptions && queryOptions.length > 0 && (
        <div id="additional-query-options-container">
          {isQueryOptionsExpanded && (
            <QueryOptionsGrid
              queryOptions={queryOptions}
              queryOptionProps={queryOptionProps}
              onChangeQueryOption={onChangeQueryOption}
              onApply={onApply}
              refreshEditorAction={refreshEditorAction}
              schemaFields={schemaFields}
              serverVersion={serverVersion}
            />
          )}
        </div>
      )}
    </form>
  );
};
