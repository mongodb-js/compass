import React, { useCallback, useMemo, useState } from 'react';
import {
  Button,
  OptionsToggle,
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  AIExperienceEntry,
  createAIPlaceholderHTMLPlaceholder,
} from '@mongodb-js/compass-generative-ai/provider';
import { connect } from '../stores/context';
import {
  useIsAIFeatureEnabled,
  usePreference,
} from 'compass-preferences-model/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

import {
  OPTION_DEFINITION,
  type QueryOption,
} from '../constants/query-option-definition';
import QueryOptionComponent from './query-option';
import QueryHistoryButtonPopover from './query-history-button-popover';
import { QueryBarRow } from './query-bar-row';
import { SaveDraftAsFavoriteModal } from './save-draft-as-favorite-modal';
import { SaveQueryMenu, type SaveModalMode } from './save-query-menu';
import {
  applyQuery,
  openExportToLanguage,
  resetQuery,
  explainQuery,
} from '../stores/query-bar-reducer';
import { toggleQueryOptions } from '../stores/query-bar-reducer';
import { isEqualDefaultQuery, isQueryValid } from '../utils/query';
import type { QueryProperty } from '../constants/query-properties';
import { QueryAI } from './query-ai';
import type {
  QueryBarThunkDispatch,
  RootState,
} from '../stores/query-bar-store';
import { hideInput, showInput } from '../stores/ai-query-reducer';
import {
  useFavoriteQueryStorageAccess,
  useRecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage/provider';
import { useQueryBarQuery } from './hooks';
import { useSyncAssistantGlobalState } from '@mongodb-js/compass-assistant';
import { toJSString } from 'mongodb-query-parser';

const queryBarFormStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  background: palette.white,
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '6px',
  padding: spacing[200],
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
  gap: spacing[200],
});

const filterContainerStyles = css({
  display: 'flex',
  position: 'relative',
  flexGrow: 1,
  alignItems: 'flex-start',
  gap: spacing[200],
});

const aiEntryContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  height: spacing[600] + spacing[100],
});

const queryOptionsContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  marginTop: spacing[200],
  padding: `0 ${spacing[200]}px`,
  gap: spacing[200],
});

const QueryOptionsToggle = connect(
  (state: RootState) => {
    return {
      isExpanded: state.queryBar.expanded,
    };
  },
  { onToggleOptions: toggleQueryOptions }
)(OptionsToggle);

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
  filterHasContent: boolean;
  showExplainButton?: boolean;
  valid: boolean;
  expanded: boolean;
  placeholders?: Record<QueryProperty, string>;
  onExplain?: () => void;
  isAIInputVisible?: boolean;
  isAIFetching?: boolean;
  onShowAIInputClick: () => void;
  onHideAIInputClick: () => void;
};

export const QueryBar: React.FunctionComponent<QueryBarProps> = ({
  buttonLabel = 'Apply',
  onApply,
  onReset,
  // Used to specify which query options to show and where they are positioned.
  queryOptionsLayout = [
    'project',
    ['sort', 'maxTimeMS'],
    ['collation', 'skip', 'limit'],
    'hint',
  ],
  queryChanged,
  resultId,
  applyId,
  filterHasContent,
  showExplainButton = false,
  valid: isQueryValid,
  expanded: isQueryOptionsExpanded,
  placeholders,
  onExplain,
  isAIInputVisible = false,
  isAIFetching = false,
  onShowAIInputClick,
  onHideAIInputClick,
}) => {
  const darkMode = useDarkMode();
  const isAIFeatureEnabled = useIsAIFeatureEnabled();
  const track = useTelemetry();

  const onFormSubmit = useCallback(
    (evt: React.FormEvent) => {
      evt.preventDefault();
      onApply();
    },
    [onApply]
  );

  const filterQueryOptionId = 'query-bar-option-input-filter';

  const filterPlaceholder = useMemo(() => {
    return isAIFeatureEnabled && !isAIInputVisible
      ? createAIPlaceholderHTMLPlaceholder({
          onClickAI: () => {
            onShowAIInputClick();
          },
          darkMode,
          placeholderText: OPTION_DEFINITION.filter.placeholder,
          track,
        })
      : placeholders?.filter;
  }, [
    isAIFeatureEnabled,
    isAIInputVisible,
    darkMode,
    placeholders?.filter,
    onShowAIInputClick,
    track,
  ]);

  const showAIEntryButton = useMemo(() => {
    if (isAIInputVisible || !isAIFeatureEnabled) {
      return false;
    }

    // See if there is content in the filter.
    return filterHasContent;
  }, [isAIFeatureEnabled, isAIInputVisible, filterHasContent]);

  const favoriteQueryStorageAvailable = !!useFavoriteQueryStorageAccess();
  const recentQueryStorageAvailable = !!useRecentQueryStorageAccess();
  const isMyQueriesEnabled = usePreference('enableMyQueries');
  const enableSavedAggregationsQueries =
    favoriteQueryStorageAvailable &&
    recentQueryStorageAvailable &&
    isMyQueriesEnabled;

  const query = useQueryBarQuery();
  useSyncAssistantGlobalState('currentQuery', toJSString(query) || null);

  // Local state for the "Save as favorite" dialog. The dialog itself
  // reads the current query-bar fields from Redux on submit, so we just
  // toggle visibility here. `saveDialogMode` tells the dialog whether
  // the user picked Save (first save) or Save as (sibling of a loaded
  // favorite); the dialog uses it only to pre-fill the name with
  // `"<original> (copy)"` in the latter case.
  const [isSaveFavoriteOpen, setIsSaveFavoriteOpen] = useState(false);
  const [saveDialogMode, setSaveDialogMode] = useState<SaveModalMode>('save');

  return (
    // The Save-as-favorite modal renders as a sibling of the `<form>`
    // rather than a child. LG Modal portals its DOM to document.body,
    // but React's synthetic event system still bubbles events through
    // the React tree — so if the modal's submit button were a React
    // descendant of this form, the form's onSubmit (Apply Query) would
    // intercept the submit event and the modal's own handleSubmit would
    // never run. Keeping the modal at the fragment root avoids that
    // bubbling and lets the modal own its own submit.
    <>
      <form
        className={cx(queryBarFormStyles, darkMode && queryBarFormDarkStyles)}
        data-testid="query-bar"
        onSubmit={onFormSubmit}
        noValidate
        data-result-id={resultId}
        data-apply-id={applyId}
      >
        {isAIFeatureEnabled && (
          <QueryAI
            onClose={() => {
              onHideAIInputClick?.();
            }}
            show={isAIInputVisible}
          />
        )}
        {/* Identity of the currently-loaded favorite is surfaced as a
          trailing segment in the collection header's breadcrumb — see
          `compass-collection`'s `useLoadedFavorite` hook, which
          subscribes to the bridge emitted from this package's
          activatePlugin. Nothing here in the query-bar UI itself. */}
        <div className={queryBarFirstRowStyles}>
          {enableSavedAggregationsQueries && <QueryHistoryButtonPopover />}
          <div className={filterContainerStyles}>
            <QueryOptionComponent
              name="filter"
              id={filterQueryOptionId}
              onApply={onApply}
              placeholder={filterPlaceholder}
              disabled={isAIFetching}
            />
            {showAIEntryButton && (
              <div className={aiEntryContainerStyles}>
                <AIExperienceEntry
                  data-testid="ai-experience-query-entry-button"
                  onClick={onShowAIInputClick}
                  type="query"
                />
              </div>
            )}
          </div>
          {showExplainButton && (
            <Button
              aria-label="Explain query"
              title="View the execution plan for the current query"
              data-testid="query-bar-explain-button"
              onClick={onExplain}
              disabled={!isQueryValid || isAIFetching}
              size="small"
              type="button"
            >
              Explain
            </Button>
          )}
          <Button
            aria-label="Reset query"
            data-testid="query-bar-reset-filter-button"
            onClick={onReset}
            disabled={!queryChanged || isAIFetching}
            size="small"
            type="button"
          >
            Reset
          </Button>
          {enableSavedAggregationsQueries && (
            <SaveQueryMenu
              disabled={!isQueryValid || !queryChanged || isAIFetching}
              onOpenSaveModal={(mode) => {
                setSaveDialogMode(mode);
                setIsSaveFavoriteOpen(true);
              }}
            />
          )}
          <Button
            data-testid="query-bar-apply-filter-button"
            disabled={!isQueryValid || isAIFetching}
            variant="primary"
            size="small"
            type="submit"
            onClick={onFormSubmit}
          >
            {buttonLabel}
          </Button>
          {queryOptionsLayout && queryOptionsLayout.length > 0 && (
            <div>
              <QueryOptionsToggle
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
                  disabled={isAIFetching}
                  placeholders={placeholders}
                />
              ))}
            </div>
          )}
      </form>
      {/* Modal rendered outside the form (see fragment-comment above).
        Mounted only while open so input state resets every time it
        opens — avoids stale fields lingering from a previous save. */}
      {isSaveFavoriteOpen && (
        <SaveDraftAsFavoriteModal
          open
          mode={saveDialogMode}
          onCancel={() => setIsSaveFavoriteOpen(false)}
        />
      )}
    </>
  );
};

type OwnProps = {
  onApply?(query: unknown): void;
  onReset?(query: unknown): void;
  source: string;
};

export default connect(
  ({ queryBar: { expanded, fields, applyId }, aiQuery }: RootState) => {
    return {
      expanded: expanded,
      queryChanged: !isEqualDefaultQuery(fields),
      filterHasContent: fields.filter.string !== '',
      valid: isQueryValid(fields),
      applyId: applyId,
      isAIInputVisible: aiQuery.isInputVisible,
      isAIFetching: aiQuery.status === 'fetching',
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
        const applied = dispatch(applyQuery(ownProps.source));
        if (applied === false) {
          return;
        }
        ownProps.onApply?.(applied);
      },
      onReset: () => {
        const reset = dispatch(resetQuery(ownProps.source));
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
