import React from 'react';
import { connect } from 'react-redux';

import { Tooltip, Body, Icon, css, cx, spacing, palette, useDarkMode, injectGlobal } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { MERGE_STAGE_PREVIEW_TEXT, OUT_STAGE_PREVIEW_TEXT } from '../../utils/stage';

import DeleteStage from './delete-stage';
import AddAfterStage from './add-after-stage';
import ToggleStage from './toggle-stage';
import StageCollapser from './stage-collapser';
import StageOperatorSelect from './stage-operator-select';
import { hasSyntaxError } from '../../utils/stage';

const STAGE_TOOLTIP_MESSAGE = {
  $out: OUT_STAGE_PREVIEW_TEXT,
  $merge: MERGE_STAGE_PREVIEW_TEXT
};

injectGlobal({
  '.dragging .stage-editor-toolbar': {
    // react-sortable-hoc sets pointer events none to the whole container which
    // is good, but also means that the cursor will not be changed. For that
    // reason we set pointer events back to auto for the drag handle when
    // dragging stage around
    pointerEvents: 'auto',
    cursor: 'grabbing',
  }
});

const STAGES_WITH_TOOLTIP = Object.keys(STAGE_TOOLTIP_MESSAGE);

const tooltipIconStyles = css({
  marginRight: spacing[2],
  cursor: 'default',
  height: spacing[3]
});

type StageEditorOutMergeTooltip = {
  stageOperator: keyof typeof STAGE_TOOLTIP_MESSAGE
};

function StageEditorOutMergeTooltip({ stageOperator }: StageEditorOutMergeTooltip) {
  if (STAGES_WITH_TOOLTIP.includes(stageOperator)) {
    return (
      <Tooltip
        trigger={({ children, ...props }) => (
          <span {...props} className={tooltipIconStyles}>
            {children}
            <Icon glyph="InfoWithCircle" />
          </span>
        )}
      >
        <Body>{STAGE_TOOLTIP_MESSAGE[stageOperator]}</Body>
      </Tooltip>
    );
  }
  return null;
}

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
  position: 'relative',
  cursor: 'grab'
});

const collapsedToolbarStyles = css({
  borderBottomWidth: 0,
});

const toolbarStylesDark = css({
  borderBottomColor: palette.gray.dark2
});

const toolbarStylesLight = css({
  borderBottomColor: palette.gray.light2
});

const toolbarWarningStyles = css({
  borderBottomColor: palette.yellow.base
});

const toolbarErrorStyles = css({
  borderBottomColor: palette.red.base
});

const rightStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexGrow: 4,
});

type StageEditorToolbarProps = {
  stageOperator?: string | null;
  index: number;
  isAutoPreviewing?: boolean;
  hasSyntaxError?: boolean;
  hasServerError?: boolean;
  isCollapsed?: boolean;
};

function StageEditorToolbar({
  stageOperator,
  index,
  isAutoPreviewing,
  hasSyntaxError,
  hasServerError,
  isCollapsed,
}: StageEditorToolbarProps) {
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        'stage-editor-toolbar',
        toolbarStyles,
        darkMode ? toolbarStylesDark : toolbarStylesLight,
        hasSyntaxError && toolbarWarningStyles,
        hasServerError && toolbarErrorStyles,
        isCollapsed && collapsedToolbarStyles,
      )}>
      <StageCollapser index={index} />
      <StageOperatorSelect index={index} />
      <ToggleStage index={index} />
      <div className={rightStyles}>
        {!isAutoPreviewing && stageOperator && ['$out', '$merge'].includes(stageOperator) && (
          <StageEditorOutMergeTooltip
            stageOperator={stageOperator as '$out'|'$merge'}
          ></StageEditorOutMergeTooltip>
        )}
        <DeleteStage index={index} />
        <AddAfterStage index={index} />
      </div>
    </div>
  );
}

export default connect((state: RootState, ownProps: { index: number}) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
  return {
    stageOperator: stage.stageOperator,
    isAutoPreviewing: !!state.autoPreview,
    hasSyntaxError: hasSyntaxError(stage),
    hasServerError: !!stage.serverError,
    isCollapsed: stage.collapsed,
  };
})(StageEditorToolbar);
