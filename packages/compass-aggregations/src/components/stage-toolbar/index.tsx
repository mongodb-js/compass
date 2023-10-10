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
} from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import ToggleStage from './toggle-stage';
import StageCollapser from './stage-collapser';
import StageOperatorSelect from './stage-operator-select';
import { hasSyntaxError } from '../../utils/stage';
import { enableFocusMode } from '../../modules/focus-mode';
import OptionMenu from './option-menu';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import { getInsightForStage } from '../../utils/insights';
import { usePreference } from 'compass-preferences-model';
import type { ServerEnvironment } from '../../modules/env';
import { createSearchIndex } from '../../modules/search-indexes';

const toolbarStyles = css({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',

  padding: `0 ${spacing[2]}px`,
  height: spacing[5] + spacing[1],

  flexShrink: 0,
  flexDirection: 'row',
  justifyContent: 'space-between',
  cursor: 'grab',
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
  gap: spacing[1] * 3,
  width: '388px', // default width of the stage editor
});

const shortSpacedStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
  whiteSpace: 'nowrap',
});

const textStyles = css({
  flex: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  // align with the text on stage preview header
  paddingLeft: spacing[2],
});

const rightStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing[1],
});

type StageToolbarProps = {
  index: number;

  stage: StoreStage;
  env: ServerEnvironment;
  isSearchIndexesSupported: boolean;
  onCreateSearchIndex: () => void;

  onOpenFocusMode: (index: number) => void;
  onStageOperatorChange?: (
    index: number,
    name: string | null,
    snippet?: string
  ) => void;
};

const DISABLED_TEXT = 'Stage disabled. Results not passed in the pipeline.';
const COLLAPSED_TEXT =
  'A sample of the aggregated results from this stage will be shown below.';

export function StageToolbar({
  index,
  stage,
  env,
  isSearchIndexesSupported,
  onCreateSearchIndex,
  onOpenFocusMode,
  onStageOperatorChange,
}: StageToolbarProps) {
  const showInsights = usePreference('showInsights', React);
  const darkMode = useDarkMode();

  const insight = useMemo(
    () =>
      getInsightForStage(
        stage,
        env,
        isSearchIndexesSupported,
        onCreateSearchIndex
      ),
    [stage, env, isSearchIndexesSupported, onCreateSearchIndex]
  );

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
        {showInsights && insight && <SignalPopover signals={insight} />}
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
      searchIndexes: { isSearchIndexesSupported },
    } = state;
    const stage = stages[ownProps.index] as StoreStage;
    return {
      stage,
      env,
      isSearchIndexesSupported,
    };
  },
  {
    onOpenFocusMode: enableFocusMode,
    onCreateSearchIndex: createSearchIndex,
  }
)(StageToolbar);
