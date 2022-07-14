import React, { useCallback } from 'react';
import {
  Button,
  Icon,
  IconButton,
  MoreOptionsToggle,
  css,
  cx,
  focusRingStyles,
  focusRingVisibleStyles,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';

import type {
  QueryOption,
  QueryBarOptionProps,
} from '../constants/query-option-definition';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import { QueryOption as QueryOptionComponent } from './query-option';
import { QueryOptionsGrid } from './query-options-grid';

const queryBarFormStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  border: `1px solid ${uiColors.gray.light2}`,
  borderRadius: '6px',
  padding: spacing[1],
  background: uiColors.white,
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

type QueryBarProps = {
  buttonLabel?: string;
  expanded: boolean;
  queryOptions?: (
    | 'project'
    | 'sort'
    | 'collation'
    | 'skip'
    | 'limit'
    | 'maxTimeMS'
  )[];
  onApply: () => void;
  onChangeQueryOption: (queryOption: QueryOption, value: string) => void;
  onOpenExportToLanguage: () => void;
  onReset: () => void;
  queryState: 'apply' | 'reset';
  refreshEditorAction: Listenable;
  schemaFields: string[];
  serverVersion: string;
  showExportToLanguageButton?: boolean;
  showQueryHistoryButton?: boolean;
  toggleExpandQueryOptions: () => void;
  toggleQueryHistory: () => void;
  valid: boolean;
} & QueryBarOptionProps;

export const QueryBar: React.FunctionComponent<QueryBarProps> = ({
  buttonLabel = 'Apply',
  expanded: isQueryOptionsExpanded = false,
  queryOptions = ['project', 'sort', 'collation', 'skip', 'limit', 'maxTimeMS'],
  onApply: _onApply,
  onChangeQueryOption,
  onOpenExportToLanguage,
  onReset,
  queryState,
  refreshEditorAction,
  schemaFields,
  serverVersion,
  showExportToLanguageButton = true,
  showQueryHistoryButton = true,
  toggleExpandQueryOptions,
  toggleQueryHistory,
  valid: isQueryValid,
  ...queryOptionProps
}) => {
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

  return (
    <form className={queryBarFormStyles} onSubmit={onFormSubmit} noValidate>
      <div className={queryBarFirstRowStyles}>
        {showQueryHistoryButton && (
          <button
            data-testid="query-history-button"
            onClick={toggleQueryHistory}
            className={openQueryHistoryStyles}
            id="open-query-history"
            aria-label="Open query history"
            type="button"
          >
            <Icon glyph="Clock" />
            <Icon glyph="CaretDown" />
          </button>
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
