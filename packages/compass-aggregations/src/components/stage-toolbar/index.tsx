import React, { useEffect, useRef, useState } from 'react';
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
  GuideCue,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import ToggleStage from './toggle-stage';
import StageCollapser from './stage-collapser';
import StageOperatorSelect from './stage-operator-select';
import { hasSyntaxError } from '../../utils/stage';
import { usePreference } from 'compass-preferences-model';
import { enableFocusMode } from '../../modules/focus-mode';
import OptionMenu from './option-menu';
import {
  setHasSeenFocusModeGuideCue,
  hasSeenFocusModeGuideCue,
} from '../../utils/local-storage';

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
  isAutoPreviewing?: boolean;
  hasSyntaxError?: boolean;
  hasServerError?: boolean;
  isCollapsed?: boolean;
  isDisabled?: boolean;
  onFocusModeEnableClick: (index: number) => void;
};

const DISABLED_TEXT = 'Stage disabled. Results not passed in the pipeline.';
const COLLAPSED_TEXT =
  'A sample of the aggregated results from this stage will be shown below.';

const GUIDE_CUE_DELAY = 700;

export function StageToolbar({
  index,
  hasSyntaxError,
  hasServerError,
  isCollapsed,
  isDisabled,
  onFocusModeEnableClick,
}: StageToolbarProps) {
  const darkMode = useDarkMode();
  const showFocusMode = usePreference('showFocusMode', React);

  const focusModeButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGuideCueVisible, setIsGuideCueVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasSeenFocusModeGuideCue()) {
        setIsGuideCueVisible(index === 0);
      }
    }, GUIDE_CUE_DELAY);
    return () => clearTimeout(timeout);
  }, [setIsGuideCueVisible, index]);

  const setGuideCueVisited = () => {
    setIsGuideCueVisible(false);
    setHasSeenFocusModeGuideCue();
  };

  const onOpenFocusMode = () => {
    onFocusModeEnableClick(index);
    if (isGuideCueVisible) {
      setGuideCueVisited();
    }
  };

  return (
    <div
      ref={containerRef}
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
        <StageCollapser index={index} />
        <Body weight="medium">Stage {index + 1}</Body>
        <div className={selectStyles}>
          <StageOperatorSelect index={index} />
        </div>
        <ToggleStage index={index} />
      </div>
      <div className={textStyles}>
        {isDisabled ? DISABLED_TEXT : isCollapsed ? COLLAPSED_TEXT : null}
      </div>
      <div className={rightStyles}>
        {showFocusMode && (
          <>
            <GuideCue
              data-testid="focus-mode-guide-cue"
              open={isGuideCueVisible}
              setOpen={() => setGuideCueVisited()}
              refEl={focusModeButtonRef}
              numberOfSteps={1}
              popoverZIndex={2}
              scrollContainer={containerRef.current}
              portalContainer={containerRef.current}
              title="Focus Mode"
              tooltipAlign="bottom"
            >
              Stage Focus Mode allows you to focus on a single stage in the
              pipeline. You can use it to edit or see the results of a stage in
              isolation.
            </GuideCue>
            <IconButton
              ref={focusModeButtonRef}
              onClick={onOpenFocusMode}
              aria-label="Open stage in focus mode"
              data-testid="focus-mode-button"
            >
              <Icon glyph="FullScreenEnter" size="small"></Icon>
            </IconButton>
          </>
        )}
        <OptionMenu index={index} />
      </div>
    </div>
  );
}

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
    return {
      isAutoPreviewing: !!state.autoPreview,
      hasSyntaxError: hasSyntaxError(stage),
      hasServerError: !!stage.serverError,
      isCollapsed: stage.collapsed,
      isDisabled: stage.disabled,
    };
  },
  { onFocusModeEnableClick: enableFocusMode }
)(StageToolbar);
