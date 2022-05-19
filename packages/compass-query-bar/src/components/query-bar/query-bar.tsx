import React from 'react';
import {
  Button,
  Icon,
  Label,
  MoreOptionsToggle,
  css,
  cx,
  focusRingStyles,
  focusRingVisibleStyles,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';

const queryBarStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  padding: spacing[2],
  border: `1px solid ${uiColors.gray.light2}`,
  borderRadius: '6px',

  // TODO: This margin will go away when the query bar is wrapped in the
  // Toolbar component in each of the plugins. COMPASS-5484
  margin: spacing[3],
});

const queryAreaStyles = css({
  flexGrow: 1,
});

const openQueryHistoryLabelStyles = css({
  display: 'inline-block',
  padding: 0,
});

const openQueryHistoryStyles = cx(
  css({
    border: 'none',
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[1]}px ${spacing[1]}px`,
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
  isQueryOptionsExpanded?: boolean;
  valid: boolean;
  queryState: 'apply' | 'reset';
  showQueryHistoryButton: boolean;
  toggleExpandQueryOptions: () => void;
  toggleQueryHistory: () => void;
};

export const QueryBar: React.FunctionComponent<QueryBarProps> = ({
  buttonLabel = 'Apply',
  expanded: isQueryOptionsExpanded = false,
  valid: isQueryValid,
  queryState,
  showQueryHistoryButton = true,
  toggleExpandQueryOptions,
  toggleQueryHistory,
}) => {
  return (
    <div className={queryBarStyles}>
      {showQueryHistoryButton && (
        <>
          <Label
            className={openQueryHistoryLabelStyles}
            htmlFor="open-query-history"
          >
            Query
          </Label>
          <button
            data-testid="pipeline-toolbar-open-pipelines-button"
            onClick={toggleQueryHistory}
            className={openQueryHistoryStyles}
            id="open-query-history"
            aria-label="Open query history"
          >
            <Icon glyph="Clock" />
            <Icon glyph="CaretDown" />
          </button>
        </>
      )}
      <div className={queryAreaStyles}>Query Area (coming soon)</div>
      {isQueryOptionsExpanded && <div id="aria-controls">Query Options</div>}
      <Button
        data-test-id="query-bar-apply-filter-button"
        onClick={() => alert('coming soon')}
        disabled={!isQueryValid}
        variant="primary"
        size="small"
      >
        {buttonLabel}
      </Button>
      <Button
        aria-label="Reset query"
        data-test-id="query-bar-reset-filter-button"
        onClick={() => alert('coming soon')}
        disabled={queryState !== 'apply'}
        size="small"
      >
        Reset
      </Button>
      <MoreOptionsToggle
        aria-controls="query-options-container"
        data-testid="query-bar-options-toggle"
        isExpanded={isQueryOptionsExpanded}
        onToggleOptions={() => {
          console.log('toggle expand');
          toggleExpandQueryOptions();
        }}
      />
    </div>
  );
};
