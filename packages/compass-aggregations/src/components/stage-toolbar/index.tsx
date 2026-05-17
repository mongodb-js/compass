import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import {
  Icon,
  Body,
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
  IconButton,
  SignalPopover,
  Button,
  Link,
  useDrawerActions,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import ToggleStage from './toggle-stage';
import StageCollapser from './stage-collapser';
import StageOperatorSelect from './stage-operator-select';
import {
  getSearchIndexNameFromSearchStage,
  hasSyntaxError,
  isSearchStage,
} from '../../utils/stage';
import { enableFocusMode } from '../../modules/focus-mode';
import OptionMenu from './option-menu';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import { addSearchStageBefore } from '../../modules/pipeline-builder/stage-editor';
import { getIsRerankFirstStage } from '../../modules/pipeline-builder/builder-helpers';
import { getInsightForStage } from '../../utils/insights';
import { usePreference } from 'compass-preferences-model/provider';
import { useSearchActivationProgramP1 } from '@mongodb-js/compass-telemetry/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { buildRerankTokenUsageUrl } from '@mongodb-js/atlas-service/provider';
import type { ServerEnvironment } from '../../modules/env';
import {
  createSearchIndex,
  openIndexesListDrawerView,
  refreshSearchIndexes,
} from '../../modules/search-indexes';
import { useRerankInsight } from '../rerank-first-stage-banner';

const toolbarStyles = css({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',

  padding: `0 ${spacing[200]}px`,
  height: spacing[800] + spacing[100],

  flexShrink: 0,
  flexDirection: 'row',
  justifyContent: 'space-between',
  cursor: 'grab',
  '&:active': {
    cursor: 'grabbing',
  },
});

const collapsedToolbarStyles = css({
  borderBottomWidth: 0,
});

const toolbarStylesDark = css({
  borderBottomColor: palette.gray.dark2,
});

const toolbarStylesLight = css({
  borderBottomColor: palette.gray.light2,
});

const toolbarWarningStyles = css({
  borderBottomColor: palette.yellow.base,
});

const toolbarErrorStyles = css({
  borderBottomColor: palette.red.base,
});

const leftStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: spacing[100] * 3,
});

const shortSpacedStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  whiteSpace: 'nowrap',
});

const viewIndexesButtonStyles = css({
  whiteSpace: 'nowrap',
});

const viewTokenUsageLinkStyles = css({
  whiteSpace: 'nowrap',
});

const textStyles = css({
  flex: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  // align with the text on stage preview header
  paddingLeft: spacing[200],
});

const rightStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing[100],
});

type StageToolbarProps = {
  index: number;
  stage: StoreStage;
  env: ServerEnvironment;
  isSearchIndexesSupported: boolean;
  isRerankFirstStage: boolean;
  hasSearchIndex: boolean;
  isSearchIndexesLoading: boolean;
  onCreateSearchIndex: () => void;
  onOpenFocusMode: (index: number) => void;
  onAddSearchStageBefore: (storeIndex: number) => void;
  onRefreshSearchIndexes: () => void;
  onStageOperatorChange?: (
    index: number,
    name: string | null,
    snippet?: string
  ) => void;
  onClickViewSearchIndexes: (indexName?: string) => void;
};

const DISABLED_TEXT = 'Stage disabled. Results not passed in the pipeline.';
const COLLAPSED_TEXT =
  'A sample of the aggregated results from this stage will be shown below.';

export function StageToolbar({
  index,
  stage,
  env,
  isSearchIndexesSupported,
  isRerankFirstStage,
  hasSearchIndex,
  isSearchIndexesLoading,
  onCreateSearchIndex,
  onOpenFocusMode,
  onAddSearchStageBefore,
  onRefreshSearchIndexes,
  onStageOperatorChange,
  onClickViewSearchIndexes,
}: StageToolbarProps) {
  const showInsights = usePreference('showInsights');
  const enableRerank = usePreference('enableRerank');
  const { enableSearchActivationProgramP1 } = useSearchActivationProgramP1();
  const darkMode = useDarkMode();
  const { openDrawer } = useDrawerActions();
  const track = useTelemetry();
  const { atlasMetadata } = useConnectionInfo();

  const viewTokenUsageHref =
    enableRerank && stage.stageOperator === '$rerank'
      ? atlasMetadata
        ? buildRerankTokenUsageUrl(atlasMetadata)
        : 'https://dochub.mongodb.org/core/$rerank#metrics'
      : null;

  const performanceInsight = useMemo(
    () =>
      getInsightForStage(
        stage,
        env,
        isSearchIndexesSupported,
        onCreateSearchIndex
      ),
    [stage, env, isSearchIndexesSupported, onCreateSearchIndex]
  );

  const rerankInsight = useRerankInsight({
    isRerankFirstStage,
    hasSearchIndex,
    isSearchIndexesLoading,
    onAddSearchStageBefore: () => onAddSearchStageBefore(index),
  });

  const insight = rerankInsight ?? performanceInsight;

  return (
    <div
      className={cx(
        'stage-editor-toolbar',
        toolbarStyles,
        darkMode ? toolbarStylesDark : toolbarStylesLight,
        hasSyntaxError(stage) && toolbarWarningStyles,
        !!stage.serverError && toolbarErrorStyles,
        stage.collapsed && collapsedToolbarStyles
      )}
    >
      <div className={leftStyles}>
        <div className={shortSpacedStyles}>
          <StageCollapser index={index} />
          <Body weight="medium">Stage {stage.idxInPipeline + 1}</Body>
          <StageOperatorSelect onChange={onStageOperatorChange} index={index} />
        </div>
        <ToggleStage index={index} />
        {viewTokenUsageHref && (
          <Link
            href={viewTokenUsageHref}
            target="_blank"
            className={viewTokenUsageLinkStyles}
            data-testid="stage-toolbar-view-token-usage-link"
          >
            View token usage
          </Link>
        )}
        {enableSearchActivationProgramP1 &&
          isSearchStage(stage.stageOperator) && (
            <Button
              data-testid="stage-toolbar-view-indexes-button"
              size="xsmall"
              className={viewIndexesButtonStyles}
              onClick={() => {
                track('Search Index View Indexes Button Clicked', {
                  context: 'Stage Toolbar',
                });
                openDrawer('compass-indexes-drawer');
                onClickViewSearchIndexes(
                  getSearchIndexNameFromSearchStage(
                    stage.stageOperator,
                    stage.value
                  ) ?? undefined
                );
              }}
              title="View Indexes"
            >
              View Indexes
            </Button>
          )}
        {showInsights && insight && (
          <SignalPopover
            signals={insight}
            onPopoverOpenChange={(open) => {
              if (open && isRerankFirstStage) onRefreshSearchIndexes();
            }}
          />
        )}
      </div>
      <div className={textStyles}>
        {stage.disabled
          ? DISABLED_TEXT
          : stage.collapsed
          ? COLLAPSED_TEXT
          : null}
      </div>
      <div className={rightStyles}>
        <IconButton
          onClick={() => onOpenFocusMode(index)}
          aria-label="Open stage in focus mode"
          title="Open stage in focus mode"
          data-testid="focus-mode-button"
          data-guide-cue-ref="focus-mode-button"
        >
          <Icon glyph="FullScreenEnter" size="small"></Icon>
        </IconButton>
        <OptionMenu index={index} />
      </div>
    </div>
  );
}

type StageToolbarOwnProps = Pick<StageToolbarProps, 'index'>;

export default connect(
  (state: RootState, ownProps: StageToolbarOwnProps) => {
    const {
      env,
      pipelineBuilder: {
        stageEditor: { stages },
      },
      searchIndexes: {
        isSearchIndexesSupported,
        indexes,
        status: searchIndexesStatus,
      },
    } = state;
    const stage = stages[ownProps.index] as StoreStage;
    return {
      stage,
      env,
      isSearchIndexesSupported,
      isRerankFirstStage: getIsRerankFirstStage(state, ownProps.index),
      hasSearchIndex: indexes.length > 0,
      isSearchIndexesLoading:
        searchIndexesStatus === 'INITIAL' ||
        searchIndexesStatus === 'LOADING' ||
        searchIndexesStatus === 'POLLING',
    };
  },
  {
    onOpenFocusMode: enableFocusMode,
    onCreateSearchIndex: createSearchIndex,
    onClickViewSearchIndexes: openIndexesListDrawerView,
    onAddSearchStageBefore: addSearchStageBefore,
    onRefreshSearchIndexes: refreshSearchIndexes,
  }
)(StageToolbar);
