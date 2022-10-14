import React, { useCallback } from 'react';
import {
  Button,
  Icon,
  MoreOptionsToggle,
  css,
  cx,
  spacing,
  palette,
  withTheme,
  Label,
  Link,
} from '@mongodb-js/compass-components';
import type { Listenable } from 'reflux';
import type AppRegistry from 'hadron-app-registry';

import type {
  QueryOption,
  QueryBarOptionProps,
} from '../constants/query-option-definition';
import { OPTION_DEFINITION } from '../constants/query-option-definition';
import {
  QueryOption as QueryOptionComponent,
  documentEditorLabelContainerStyles,
} from './query-option';
import { QueryHistoryButtonPopover } from './query-history-button-popover';
import { QueryBarRow } from './query-bar-row';
import type { CompletionWithServerInfo } from '@mongodb-js/compass-editor';

const queryBarFormStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  background: palette.white,
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '6px',
  padding: spacing[2],
});

const queryBarFormDarkStyles = css({
  background: palette.gray.dark3,
  borderColor: palette.gray.dark2,
});

const queryBarFirstRowStyles = css({
  display: 'flex',
  // NOTE: To keep the elements in the query bar from re-positioning
  // vertically when the filter input is multi-line we use
  // `flex-start` here. It is more brittle as it does require the other elements
  // to account for their height individually.
  alignItems: 'flex-start',
  gap: spacing[2],
  paddingLeft: spacing[2],
});

const moreOptionsContainerStyles = css({
  // We explicitly offset this element so we can use
  // `alignItems: 'flex-start'` on the first row of the query bar.
  paddingTop: 2,
  paddingBottom: 2,
});

const filterContainerStyles = css({
  flexGrow: 1,
});

const filterLabelStyles = css({
  padding: 0,
});

const queryOptionsContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  marginTop: spacing[2],
  padding: `0 ${spacing[2]}px`,
  gap: spacing[2],
});

const queryBarDocumentationLink =
  'https://docs.mongodb.com/compass/current/query/filter/';

type QueryBarProps = {
  buttonLabel?: string;
  darkMode?: boolean;
  expanded: boolean;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  onApply: () => void;
  onChangeQueryOption: (queryOption: QueryOption, value: string) => void;
  onOpenExportToLanguage: () => void;
  onReset: () => void;
  queryOptionsLayout?: (QueryOption | QueryOption[])[];
  queryState: 'apply' | 'reset';
  refreshEditorAction: Listenable;
  resultId: string | number;
  schemaFields: CompletionWithServerInfo[];
  serverVersion: string;
  showExportToLanguageButton?: boolean;
  showQueryHistoryButton?: boolean;
  toggleExpandQueryOptions: () => void;
  valid: boolean;
} & QueryBarOptionProps;

const UnthemedQueryBar: React.FunctionComponent<QueryBarProps> = ({
  buttonLabel = 'Apply',
  darkMode,
  expanded: isQueryOptionsExpanded = false,
  globalAppRegistry,
  localAppRegistry,
  onApply: _onApply,
  onChangeQueryOption,
  onOpenExportToLanguage,
  onReset,
  // Used to specify which query options to show and where they are positioned.
  queryOptionsLayout = [
    'project',
    ['sort', 'maxTimeMS'],
    ['collation', 'skip', 'limit'],
  ],
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

  const filterQueryOptionId = 'query-bar-option-input-filter';

  return (
    <form
      className={cx(queryBarFormStyles, darkMode && queryBarFormDarkStyles)}
      data-testid="query-bar"
      onSubmit={onFormSubmit}
      noValidate
      data-result-id={resultId}
    >
      <div className={queryBarFirstRowStyles}>
        <div className={documentEditorLabelContainerStyles}>
          <Label
            htmlFor={filterQueryOptionId}
            id="query-bar-option-input-filter-label"
            className={filterLabelStyles}
          >
            <Link href={queryBarDocumentationLink} target="_blank">
              Filter
            </Link>
          </Label>
          {showQueryHistoryButton && (
            <QueryHistoryButtonPopover
              localAppRegistry={localAppRegistry}
              globalAppRegistry={globalAppRegistry}
            />
          )}
        </div>
        <div className={filterContainerStyles}>
          <QueryOptionComponent
            hasError={!queryOptionProps.filterValid}
            queryOption="filter"
            id={filterQueryOptionId}
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

        {queryOptionsLayout && queryOptionsLayout.length > 0 && (
          <div className={moreOptionsContainerStyles}>
            <MoreOptionsToggle
              aria-controls="additional-query-options-container"
              data-testid="query-bar-options-toggle"
              isExpanded={isQueryOptionsExpanded}
              onToggleOptions={toggleExpandQueryOptions}
            />
          </div>
        )}
      </div>
      {isQueryOptionsExpanded &&
        queryOptionsLayout &&
        queryOptionsLayout.length > 0 && (
          <div
            className={queryOptionsContainerStyles}
            id="additional-query-options-container"
          >
            {queryOptionsLayout.map((queryOptionRowLayout, rowIndex) => (
              <QueryBarRow
                queryOptionsLayout={queryOptionRowLayout}
                key={`query-bar-row-${rowIndex}`}
                queryOptionProps={queryOptionProps}
                onChangeQueryOption={onChangeQueryOption}
                onApply={onApply}
                refreshEditorAction={refreshEditorAction}
                schemaFields={schemaFields}
                serverVersion={serverVersion}
              />
            ))}
          </div>
        )}
    </form>
  );
};

const QueryBar = withTheme(UnthemedQueryBar);

export { QueryBar };
