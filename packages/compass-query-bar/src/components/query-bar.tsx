import React, { useCallback } from 'react';
import {
  Button,
  Icon,
  MoreOptionsToggle,
  css,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';
import type AppRegistry from 'hadron-app-registry';

import type {
  QueryOption,
  QueryBarOptionProps,
} from '../constants/query-option-definition';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import { QueryOption as QueryOptionComponent } from './query-option';
import { QueryOptionsGrid } from './query-options-grid';
import { QueryHistoryButtonPopover } from './query-history-button-popover';

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
  resultId: string | number;
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
  resultId,
  schemaFields,
  serverVersion,
  showExportToLanguageButton = true,
  showQueryHistoryButton = true,
  toggleExpandQueryOptions,
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
    <form
      className={queryBarFormStyles}
      data-testid="query-bar"
      onSubmit={onFormSubmit}
      noValidate
      data-result-id={resultId}
    >
      <div className={queryBarFirstRowStyles}>
        {showQueryHistoryButton && (
          <QueryHistoryButtonPopover
            localAppRegistry={localAppRegistry}
            globalAppRegistry={globalAppRegistry}
          />
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
          onClick={onFormSubmit}
        >
          {buttonLabel}
        </Button>
        {showExportToLanguageButton && (
          <Button
            onClick={onOpenExportToLanguage}
            title="Open export to language"
            aria-label="Open export to language"
            data-testid="query-bar-open-export-to-language-button"
            type="button"
            size="small"
          >
            <Icon glyph="Code" />
          </Button>
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
