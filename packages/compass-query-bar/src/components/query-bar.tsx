import React, { useCallback, useMemo, useState } from 'react';
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
import {
  OPTION_DEFINITION,
  type QueryOption,
} from '../constants/query-option-definition';
import QueryOptionComponent, {
  documentEditorLabelContainerStyles,
} from './query-option';
import QueryHistoryButtonPopover from './query-history-button-popover';
import { QueryBarRow } from './query-bar-row';
import type {
  QueryBarState,
  QueryBarThunkDispatch,
} from '../stores/query-bar-reducer';
import { isEqualDefaultQuery } from '../stores/query-bar-reducer';
import { isQueryValid } from '../stores/query-bar-reducer';
import {
  applyQuery,
  openExportToLanguage,
  resetQuery,
  explainQuery,
} from '../stores/query-bar-reducer';
import { toggleQueryOptions } from '../stores/query-bar-reducer';
import type { QueryProperty } from '../constants/query-properties';
import { usePreference } from 'compass-preferences-model';
import type { Signal } from '@mongodb-js/compass-components';
import { AITextInput } from './generative-ai/ai-text-input';

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
  (state: QueryBarState) => {
    return {
      isExpanded: state.expanded,
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

function createAIPlaceholderHTMLPlaceholder({
  onClickAI,
  darkMode,
}: {
  onClickAI: () => void;
  darkMode?: boolean;
}): HTMLElement {
  const containerEl = document.createElement('div');

  const placeholderText = OPTION_DEFINITION.filter.placeholder;
  const placeholderTextEl = document.createTextNode(`${placeholderText} or `);
  containerEl.appendChild(placeholderTextEl);

  const aiButtonEl = document.createElement('button');
  aiButtonEl.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClickAI();
  };

  const aiColor = darkMode ? palette.green.dark1 : palette.green.dark2;

  // Reset button styles.
  aiButtonEl.style.border = 'none';
  aiButtonEl.style.outline = 'none';
  aiButtonEl.style.boxShadow = 'none';
  aiButtonEl.style.padding = '0px';
  aiButtonEl.style.margin = '0px';
  aiButtonEl.style.background = 'none';
  aiButtonEl.style.cursor = 'pointer';
  aiButtonEl.style.whiteSpace = 'normal';
  aiButtonEl.style.position = 'relative';

  // Text styles.
  aiButtonEl.style.textDecoration = 'underline';
  aiButtonEl.style.fontWeight = 'bold';
  aiButtonEl.style.color = aiColor;

  // Aligning elements.
  aiButtonEl.style.display = 'inline-flex';
  aiButtonEl.style.gap = `${spacing[1]}px`;

  const robotIconSVG = `<span>Ask AI</span>
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="display: inline-block; margin-top: -2px; margin-bottom: -10px" xmlns="http://www.w3.org/2000/svg">
  <rect width="20" height="20" rx="4" fill="${aiColor}"/>
  <path d="M6.66675 6.66669H13.3334C13.687 6.66669 14.0262 6.80716 14.2762 7.05721C14.5263 7.30726 14.6667 7.6464 14.6667 8.00002V8.66669L15.3334 9.33335V11.3334L14.6667 12V14C14.6667 14.3536 14.5263 14.6928 14.2762 14.9428C14.0262 15.1929 13.687 15.3334 13.3334 15.3334H6.66675C6.31313 15.3334 5.97399 15.1929 5.72394 14.9428C5.47389 14.6928 5.33341 14.3536 5.33341 14V12L4.66675 11.3334V9.33335L5.33341 8.66669V8.00002C5.33341 7.6464 5.47389 7.30726 5.72394 7.05721C5.97399 6.80716 6.31313 6.66669 6.66675 6.66669Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8.66675 12.6667H11.3334" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.99992 6.66667L7.33325 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 6.66667L12.6667 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="7.75" cy="9.75" r="0.75" fill="white"/>
  <circle cx="12.25" cy="9.75" r="0.75" fill="white"/>
</svg>`;
  aiButtonEl.innerHTML = robotIconSVG;

  containerEl.appendChild(aiButtonEl);

  return containerEl;
}

// TODO: Have somewhere nice.
// // Override codemirror styles to make the `Ask AI` button clickable.
// const codeEditorStyles = css({
//   '& .cm-placeholder': {
//     pointerEvents: 'auto',
//   },
// });

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
}) => {
  const darkMode = useDarkMode();
  const newExplainPlan = usePreference('newExplainPlan', React);
  const enableAIQuery = usePreference('enableAIExperience', React);

  // TODO: Prob move to store.
  const [showAIQuery, setShowAIQuery] = useState(false);

  const onFormSubmit = useCallback(
    (evt: React.FormEvent) => {
      evt.preventDefault();
      onApply();
    },
    [onApply]
  );

  const filterQueryOptionId = 'query-bar-option-input-filter';

  const filterPlaceholder = useMemo(() => {
    return enableAIQuery && !showAIQuery
      ? createAIPlaceholderHTMLPlaceholder({
          onClickAI: () => setShowAIQuery(true),
          darkMode,
        })
      : placeholders?.filter;
  }, [darkMode, showAIQuery, enableAIQuery, placeholders?.filter]);

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
        <AITextInput onClose={() => setShowAIQuery(false)} show={showAIQuery} />
      )}
    </form>
  );
};

export default connect(
  (state: QueryBarState) => {
    return {
      expanded: state.expanded,
      queryChanged: !isEqualDefaultQuery(state),
      valid: isQueryValid(state),
      applyId: state.applyId,
    };
  },
  (
    dispatch: QueryBarThunkDispatch,
    ownProps: { onApply?(query: unknown): void; onReset?(query: unknown): void }
  ) => {
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
    };
  }
)(QueryBar);
