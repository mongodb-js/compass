import React, { useCallback, useMemo } from 'react';
import {
  Button,
  DropdownMenuButton,
  type MenuAction,
  OptionsToggle,
  SpinLoader,
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
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

import {
  OPTION_DEFINITION,
  type QueryOption,
} from '../constants/query-option-definition';
import QueryOptionComponent from './query-option';
import QueryHistoryButtonPopover from './query-history-button-popover';
import { QueryBarRow } from './query-bar-row';
import {
  applyQuery,
  openExportToLanguage,
  resetQuery,
  explainQuery,
  explainQueryRawOutput,
  explainQueryInterpret,
  type ExplainMode,
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
import {
  useSyncAssistantGlobalState,
  useAssistantActions,
} from '@mongodb-js/compass-assistant';
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
  onExplainRawOutput?: () => void;
  onExplainInterpret?: () => void;
  isAIInputVisible?: boolean;
  isAIFetching?: boolean;
  isInterpretLoading?: boolean;
  onShowAIInputClick: () => void;
  onHideAIInputClick: () => void;
  source: string;
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
  onExplainRawOutput,
  onExplainInterpret,
  isAIInputVisible = false,
  isAIFetching = false,
  isInterpretLoading = false,
  onShowAIInputClick,
  onHideAIInputClick,
  source,
}) => {
  const darkMode = useDarkMode();
  const isAIFeatureEnabled = useIsAIFeatureEnabled();
  const track = useTelemetry();
  const enableSearchActivationProgramP2 = usePreference(
    'enableSearchActivationProgramP2'
  );
  const { getIsAssistantEnabled } = useAssistantActions();
  const isAssistantEnabled = getIsAssistantEnabled();

  const explainActions = useMemo(
    (): MenuAction<ExplainMode>[] => [
      {
        action: 'interpret',
        label: 'Interpret',
        icon: isInterpretLoading ? (
          <SpinLoader title="Loading interpret" />
        ) : (
          'Sparkle'
        ),
        isDisabled: !isAssistantEnabled || isInterpretLoading,
        disabledDescription: isInterpretLoading
          ? 'Interpret in progress'
          : !isAssistantEnabled
          ? 'Assistant is not available'
          : undefined,
      },
      {
        action: 'visual-tree',
        label: 'Visual tree',
        icon: 'Diagram',
      },
      {
        action: 'raw-output',
        label: 'Raw output',
        icon: 'CurlyBraces',
      },
    ],
    [isAssistantEnabled, isInterpretLoading]
  );

  const onExplainAction = useCallback(
    (action: ExplainMode) => {
      if (action === 'interpret') {
        onExplainInterpret?.();
      } else if (action === 'visual-tree') {
        onExplain?.();
      } else {
        onExplainRawOutput?.();
      }
    },
    [onExplain, onExplainRawOutput, onExplainInterpret]
  );

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

  const connectionInfoRef = useConnectionInfoRef();
  const handleReset = useCallback(() => {
    track('Query Reset Clicked', { source }, connectionInfoRef.current);
    onReset();
  }, [connectionInfoRef, onReset, source, track]);

  return (
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
        {showExplainButton &&
          (enableSearchActivationProgramP2 ? (
            <DropdownMenuButton
              data-testid="query-bar-explain-dropdown-button"
              buttonText="Explain"
              buttonProps={{
                size: 'small',
                disabled: !isQueryValid || isAIFetching,
                leftGlyph: isInterpretLoading ? <SpinLoader /> : undefined,
              }}
              actions={explainActions}
              onAction={onExplainAction}
              hideOnNarrow={false}
            />
          ) : (
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
          ))}
        <Button
          aria-label="Reset query"
          data-testid="query-bar-reset-filter-button"
          onClick={handleReset}
          disabled={!queryChanged || isAIFetching}
          size="small"
          type="button"
        >
          Reset
        </Button>
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
  );
};

type OwnProps = {
  onApply?(query: unknown): void;
  onReset?(query: unknown): void;
  source: string;
};

export default connect(
  ({
    queryBar: { expanded, fields, applyId, isInterpretLoading },
    aiQuery,
  }: RootState) => {
    return {
      expanded: expanded,
      queryChanged: !isEqualDefaultQuery(fields),
      filterHasContent: fields.filter.string !== '',
      valid: isQueryValid(fields),
      applyId: applyId,
      isAIInputVisible: aiQuery.isInputVisible,
      isAIFetching: aiQuery.status === 'fetching',
      isInterpretLoading,
    };
  },
  (dispatch: QueryBarThunkDispatch, ownProps: OwnProps) => {
    return {
      onExplain: () => {
        dispatch(explainQuery());
      },
      onExplainRawOutput: () => {
        dispatch(explainQueryRawOutput());
      },
      onExplainInterpret: () => {
        dispatch(explainQueryInterpret());
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
