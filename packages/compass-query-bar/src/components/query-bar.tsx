import React, { useCallback, useRef } from 'react';
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
  usePersistedState,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { useInView } from 'react-intersection-observer';
import type { QueryOption } from '../constants/query-option-definition';
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
}) => {
  const showExplainButtonRef = useRef<HTMLDivElement>(null);
  const [showExplainButtonCue, setShowExplainButtonCue] = usePersistedState(
    'show-explain-button-cue',
    true
  );
  const darkMode = useDarkMode();
  const newExplainPlan = usePreference('newExplainPlan', React);
  const [inViewRef, inView] = useInView({ initialInView: false });

  const onExplainClick = useCallback(() => {
    onExplain?.();
    setShowExplainButtonCue(false);
  }, [onExplain, setShowExplainButtonCue]);

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
      data-apply-id={applyId}
    >
      <div ref={inViewRef} className={queryBarFirstRowStyles}>
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
            placeholder={placeholders?.filter}
          />
        </div>
        {showExplainButton && newExplainPlan && (
          <>
            <div ref={showExplainButtonRef}>
              <Button
                aria-label="Reset query"
                data-testid="query-bar-reset-filter-button"
                onClick={onExplainClick}
                disabled={!isQueryValid}
                size="small"
                type="button"
              >
                Explain
              </Button>
            </div>
            <GuideCue
              refEl={showExplainButtonRef}
              open={inView && showExplainButtonCue}
              setOpen={setShowExplainButtonCue}
              title="“Explain Plan” has changed"
              numberOfSteps={1}
              currentStep={1}
            >
              To view a query’s execution plan, click “Explain” as you would on
              an aggregation pipeline.
            </GuideCue>
          </>
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
