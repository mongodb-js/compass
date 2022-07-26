import React, { useCallback, useRef, useState } from 'react';
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
  useOnClickOutside,
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
  padding: spacing[2],
});

const queryBarFirstRowStyles = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: spacing[2],
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
  maxHeight: 'calc(100vh - 270px)',
  display: 'flex',
  marginLeft: -spacing[4], // Align to the left of the query bar.
});

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

  useOnClickOutside(
    queryHistoryContainerRef,
    showQueryHistory,
    onClickOutsideQueryHistory
  );

  const onHideQueryHistory = useCallback(() => {
    setShowQueryHistory(false);
  }, [setShowQueryHistory]);

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
