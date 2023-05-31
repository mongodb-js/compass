import React from 'react';
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
  useGuideCue,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import ToggleStage from './toggle-stage';
import StageCollapser from './stage-collapser';
import StageOperatorSelect from './stage-operator-select';
import { hasSyntaxError } from '../../utils/stage';
import { enableFocusMode } from '../../modules/focus-mode';
import OptionMenu from './option-menu';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';

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
  gap: spacing[1],
  width: '388px', // default width of the stage editor
});

const selectStyles = css({
  marginRight: spacing[2],
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
  idxInPipeline: number;
  isAutoPreviewing?: boolean;
  hasSyntaxError?: boolean;
  hasServerError?: boolean;
  isCollapsed?: boolean;
  isDisabled?: boolean;
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
  idxInPipeline,
  hasSyntaxError,
  hasServerError,
  isCollapsed,
  isDisabled,
  onOpenFocusMode,
  onStageOperatorChange,
}: StageToolbarProps) {
  const darkMode = useDarkMode();

  const intersectingRef = React.useRef<HTMLDivElement | null>(null);

  const [ref1, ref2, ref3, ref4, ref5] = useGuideCue([
    {
      id: 'Stage Collapser',
      groupId: 'Stage Toolbar',
      title: 'Collapser',
      content: <p>Collage a stage</p>,
      intersectingRef,
    },
    {
      id: 'Stage Number',
      groupId: 'Stage Toolbar',
      title: 'Number',
      content: <p>Stage number</p>,
      intersectingRef,
    },
    {
      id: 'Stage Dropdown',
      groupId: 'Stage Toolbar',
      title: 'Dropdown',
      content: <p>Stage select dropdown</p>,
      intersectingRef,
    },
    {
      id: 'Stage Toggle',
      groupId: 'Stage Toolbar',
      title: 'Toggle',
      content: <p>Toggle your stage here</p>,
      intersectingRef,
    },
    {
      id: 'Stage Focus',
      groupId: 'Stage Toolbar',
      title: 'Focus',
      content: <p>Focus on stage here</p>,
      intersectingRef,
    },
  ]);

  return (
    <div
      ref={intersectingRef}
      className={cx(
        'stage-editor-toolbar',
        toolbarStyles,
        darkMode ? toolbarStylesDark : toolbarStylesLight,
        hasSyntaxError && toolbarWarningStyles,
        hasServerError && toolbarErrorStyles,
        isCollapsed && collapsedToolbarStyles
      )}
    >
      <div className={leftStyles}>
        <div ref={ref1}>
          <StageCollapser index={index} />
        </div>
        <div ref={ref2}>
          <Body weight="medium">Stage {idxInPipeline + 1}</Body>
        </div>
        <div ref={ref3} className={selectStyles}>
          <StageOperatorSelect onChange={onStageOperatorChange} index={index} />
        </div>
        <div ref={ref4}>
          <ToggleStage index={index} />
        </div>
      </div>
      <div className={textStyles}>
        {isDisabled ? DISABLED_TEXT : isCollapsed ? COLLAPSED_TEXT : null}
      </div>
      <div className={rightStyles}>
        <IconButton
          ref={ref5}
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
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = state;
    const stage = stages[ownProps.index] as StoreStage;
    return {
      idxInPipeline: stage.idxInPipeline,
      isAutoPreviewing: !!state.autoPreview,
      hasSyntaxError: hasSyntaxError(stage),
      hasServerError: !!stage.serverError,
      isCollapsed: stage.collapsed,
      isDisabled: stage.disabled,
    };
  },
  {
    onOpenFocusMode: enableFocusMode,
  }
)(StageToolbar);
