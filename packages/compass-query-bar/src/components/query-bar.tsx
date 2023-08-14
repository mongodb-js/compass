import React, { useCallback, useMemo } from 'react';
import {
  Button,
  Icon,
  MoreOptionsToggle,
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
  Label,
  Link,
  GuideCue,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { usePreference } from 'compass-preferences-model';
import type { Signal } from '@mongodb-js/compass-components';

import { type QueryOption } from '../constants/query-option-definition';
import QueryOptionComponent, {
  documentEditorLabelContainerStyles,
} from './query-option';
import QueryHistoryButtonPopover from './query-history-button-popover';
import { QueryBarRow } from './query-bar-row';
import {
  applyQuery,
  openExportToLanguage,
  resetQuery,
  explainQuery,
} from '../stores/query-bar-reducer';
import { toggleQueryOptions } from '../stores/query-bar-reducer';
import { isEqualDefaultQuery, isQueryValid } from '../utils/query';
import type { QueryProperty } from '../constants/query-properties';
import { AITextInput } from './generative-ai/ai-text-input';
import type {
  QueryBarThunkDispatch,
  RootState,
} from '../stores/query-bar-store';
import { createAIPlaceholderHTMLPlaceholder } from './generative-ai/ai-experience-entry';
import { hideInput, showInput } from '../stores/ai-query-reducer';

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
  background: palette.black,
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
  position: 'relative',
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

const QueryMoreOptionsToggle = connect(
  (state: RootState) => {
    return {
      isExpanded: state.queryBar.expanded,
      label() {
        return 'Options';
      },
      'aria-label'(expanded: boolean) {
        return expanded ? 'Fewer Options' : 'More Options';
      },
    };
  },
  { onToggleOptions: toggleQueryOptions }
)(MoreOptionsToggle);

type QueryBarProps = {
  buttonLabel?: string;
  onApply: () => void;
  onReset: () => void;
  onOpenExportToLanguage: () => void;
  queryOptionsLayout?: (QueryOption | QueryOption[])[];
  queryChanged: boolean;
  resultId?: string | number;
  /**
   * For testing purposes only, allows to track whether or not apply button was
   * clicked or not
   */
  applyId: number;
  showExplainButton?: boolean;
  showExportToLanguageButton?: boolean;
  showQueryHistoryButton?: boolean;
  valid: boolean;
  expanded: boolean;
  placeholders?: Record<QueryProperty, string>;
  onExplain?: () => void;
  insights?: Signal | Signal[];
  isAIInputVisible?: boolean;
  onShowAIInputClick?: () => void;
  onHideAIInputClick?: () => void;
};

export const QueryBar: React.FunctionComponent<QueryBarProps> = ({
  buttonLabel = 'Apply',
  onApply,
  onReset,
  onOpenExportToLanguage,
  // Used to specify which query options to show and where they are positioned.
  queryOptionsLayout = [
    'project',
    ['sort', 'maxTimeMS'],
    ['collation', 'skip', 'limit'],
  ],
  queryChanged,
  resultId,
  applyId,
  showExplainButton = false,
  showExportToLanguageButton = true,
  showQueryHistoryButton = true,
  valid: isQueryValid,
  expanded: isQueryOptionsExpanded,
  placeholders,
  onExplain,
  insights,
  isAIInputVisible = false,
  onShowAIInputClick,
  onHideAIInputClick,
}) => {
  const darkMode = useDarkMode();
  const newExplainPlan = usePreference('newExplainPlan', React);
  const enableAIQuery = usePreference('enableAIExperience', React);

  const onFormSubmit = useCallback(
    (evt: React.FormEvent) => {
      evt.preventDefault();
      onApply();
    },
    [onApply]
  );

  const filterQueryOptionId = 'query-bar-option-input-filter';

  const filterPlaceholder = useMemo(() => {
    return enableAIQuery && !isAIInputVisible
      ? createAIPlaceholderHTMLPlaceholder({
          onClickAI: () => {
            onShowAIInputClick?.();
          },
          darkMode,
        })
      : placeholders?.filter;
  }, [
    enableAIQuery,
    isAIInputVisible,
    darkMode,
    placeholders?.filter,
    onShowAIInputClick,
  ]);

  return (
    <form
      className={cx(queryBarFormStyles, darkMode && queryBarFormDarkStyles)}
      data-testid="query-bar"
      onSubmit={onFormSubmit}
      noValidate
      data-result-id={resultId}
      data-apply-id={applyId}
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
          {showQueryHistoryButton && <QueryHistoryButtonPopover />}
        </div>
        <div className={filterContainerStyles}>
          <QueryOptionComponent
            name="filter"
            id={filterQueryOptionId}
            onApply={onApply}
            placeholder={filterPlaceholder}
            insights={insights}
          />
        </div>
        {showExplainButton && newExplainPlan && (
          <GuideCue
            cueId="query-bar-explain-plan"
            title="“Explain Plan” has changed"
            description={
              'To view a query’s execution plan, click “Explain” as you would on an aggregation pipeline.'
            }
            trigger={({ ref }) => (
              <Button
                ref={ref}
                aria-label="Reset query"
                data-testid="query-bar-explain-button"
                onClick={onExplain}
                disabled={!isQueryValid}
                size="small"
                type="button"
              >
                Explain
              </Button>
            )}
          />
        )}
        <Button
          aria-label="Reset query"
          data-testid="query-bar-reset-filter-button"
          onClick={onReset}
          disabled={!queryChanged}
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
            <QueryMoreOptionsToggle
              aria-controls="additional-query-options-container"
              data-testid="query-bar-options-toggle"
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
                onApply={onApply}
                placeholders={placeholders}
              />
            ))}
          </div>
        )}
      {enableAIQuery && (
        <AITextInput
          onClose={() => {
            onHideAIInputClick?.();
          }}
          show={isAIInputVisible}
        />
      )}
    </form>
  );
};

type OwnProps = {
  onApply?(query: unknown): void;
  onReset?(query: unknown): void;
};

export default connect(
  ({ queryBar: { expanded, fields, applyId }, aiQuery }: RootState) => {
    return {
      expanded: expanded,
      queryChanged: !isEqualDefaultQuery(fields),
      valid: isQueryValid(fields),
      applyId: applyId,
      isAIInputVisible: aiQuery.isInputVisible,
    };
  },
  (dispatch: QueryBarThunkDispatch, ownProps: OwnProps) => {
    return {
      onExplain: () => {
        dispatch(explainQuery());
      },
      onOpenExportToLanguage: () => {
        dispatch(openExportToLanguage());
      },
      onApply: () => {
        const applied = dispatch(applyQuery());
        if (applied === false) {
          return;
        }
        ownProps.onApply?.(applied);
      },
      onReset: () => {
        const reset = dispatch(resetQuery());
        if (reset === false) {
          return;
        }
        ownProps.onReset?.(reset);
      },
      onShowAIInputClick: () => {
        void dispatch(showInput());
      },
      onHideAIInputClick: () => {
        dispatch(hideInput());
      },
    };
  }
)(QueryBar);
