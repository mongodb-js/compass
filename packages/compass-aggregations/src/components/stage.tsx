import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { Resizable } from 're-resizable';

import {
  KeylineCard,
  css,
  cx,
  spacing,
  palette,
  GuideCue,
} from '@mongodb-js/compass-components';
import { type AceEditor } from '@mongodb-js/compass-editor';

import { useSortable } from '@dnd-kit/sortable';
import { CSS as cssDndKit } from '@dnd-kit/utilities';

import type { RootState } from '../modules';

import ResizeHandle from './resize-handle';
import StageToolbar from './stage-toolbar';
import StageEditor from './stage-editor';
import StagePreview from './stage-preview';
import { hasSyntaxError } from '../utils/stage';
import { useInView } from 'react-intersection-observer';
import {
  setHasSeenFocusModeGuideCue,
  hasSeenFocusModeGuideCue,
} from '../utils/local-storage';

const stageStyles = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  overflow: 'hidden', // this is so that the top left red border corner does not get cut off when there's a server error
});

const stageWarningStyles = css({
  borderColor: palette.yellow.base,
});

const stageErrorStyles = css({
  borderColor: palette.red.base,
});

const stageContentStyles = css({
  display: 'flex',
});

const stageEditorNoPreviewStyles = css({
  width: '100%',
});

const stagePreviewContainerStyles = css({
  display: 'flex',
  position: 'relative',
  flexDirection: 'column',
  width: '100%',
  overflow: 'auto',
});

const stageEditorContainerStyles = css({
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
});

const focusModeGuideCueStyles = css({
  position: 'absolute',
  // 28 (options button) + 14 (focus mode button) + 4 (gap) + 8 (padding) + 1 (border) + 2 (guide cue notch)
  right: '57px',
});

const RESIZABLE_DIRECTIONS = {
  top: false,
  right: true,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false,
};

type ResizableEditorProps = {
  index: number;
  isAutoPreviewing: boolean;
  onLoad: (editor: AceEditor) => void;
};

function ResizableEditor({
  index,
  isAutoPreviewing,
  onLoad,
}: ResizableEditorProps) {
  const editor = (
    <StageEditor
      onLoad={onLoad}
      index={index}
      className={stageEditorContainerStyles}
    />
  );

  if (!isAutoPreviewing) {
    return <div className={stageEditorNoPreviewStyles}>{editor}</div>;
  }

  return (
    <Resizable
      defaultSize={{
        width: '388px',
        height: 'auto',
      }}
      minWidth="260px"
      maxWidth="92%"
      enable={RESIZABLE_DIRECTIONS}
      handleComponent={{
        right: <ResizeHandle />,
      }}
      handleStyles={{
        right: {
          // Position the line in the middle of the container so that:
          // a) It sits on the border of the editor and preview areas rather
          //    than inside the editor.
          // b) The user initiates dragging from the line and not slightly off
          //    to the left.
          // If this ever needs to be tweaked, the easiest way is to give the
          // editor and preview toolbars different background colours and add a
          // transparent background here.
          right: '-9px', // default -5px
        },
      }}
    >
      {editor}
    </Resizable>
  );
}

const DEFAULT_OPACITY = 0.6;

export type StageProps = {
  id: number;
  index: number;
  isEnabled: boolean;
  isExpanded: boolean;
  hasSyntaxError: boolean;
  hasServerError: boolean;
  isAutoPreviewing: boolean;
};

function Stage({
  id,
  index,
  isEnabled,
  isExpanded,
  hasSyntaxError,
  hasServerError,
  isAutoPreviewing,
}: StageProps) {
  const editorRef = useRef<AceEditor | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Focus Mode Guide Cue
  const [isGuideCueVisible, setIsGuideCueVisible] = useState(false);
  const [setIntersectingRef, isIntersecting] = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    if (!hasSeenFocusModeGuideCue()) {
      setIsGuideCueVisible(index === 0);
    }
  }, [setIsGuideCueVisible, index]);

  const setGuideCueVisited = () => {
    setIsGuideCueVisible(false);
    setHasSeenFocusModeGuideCue();
  };

  const opacity = isEnabled ? 1 : DEFAULT_OPACITY;
  const { setNodeRef, transform, transition, listeners, isDragging } =
    useSortable({
      id: id + 1,
    });
  const style = {
    transform: cssDndKit.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  const setContainerRef = useCallback(
    (ref: HTMLDivElement) => {
      setNodeRef(ref);
      containerRef.current = ref;
    },
    [containerRef, setNodeRef]
  );

  return (
    <div ref={setContainerRef} style={style}>
      <div className={focusModeGuideCueStyles}>
        <GuideCue
          data-testid="focus-mode-guide-cue"
          open={isIntersecting && isGuideCueVisible}
          setOpen={() => setGuideCueVisited()}
          refEl={{
            current:
              containerRef.current?.querySelector(
                '[data-guide-cue-ref="focus-mode-button"]'
              ) || null,
          }}
          numberOfSteps={1}
          popoverZIndex={2}
          // @ts-expect-error LG Guide Cue does not expose usePortal prop
          usePortal={false}
          title="Focus Mode"
        >
          Stage Focus Mode allows you to focus on a single stage in the
          pipeline. You can use it to edit or see the results of a stage in
          isolation.
        </GuideCue>
      </div>
      <KeylineCard
        data-testid="stage-card"
        data-stage-index={index}
        className={cx(
          stageStyles,
          hasSyntaxError && stageWarningStyles,
          hasServerError && stageErrorStyles
        )}
      >
        <div {...listeners} ref={setIntersectingRef}>
          <StageToolbar
            onFocusModeClicked={setGuideCueVisited}
            editorRef={editorRef}
            index={index}
          />
        </div>
        {isExpanded && (
          <div style={{ opacity }} className={stageContentStyles}>
            <ResizableEditor
              index={index}
              isAutoPreviewing={isAutoPreviewing}
              onLoad={(editor) => {
                editorRef.current = editor;
              }}
            />
            {isAutoPreviewing && (
              <div className={stagePreviewContainerStyles}>
                <StagePreview index={index} />
              </div>
            )}
          </div>
        )}
      </KeylineCard>
    </div>
  );
}

type StageOwnProps = {
  index: number;
};

export default connect((state: RootState, ownProps: StageOwnProps) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
  return {
    id: stage.id,
    isEnabled: !stage.disabled,
    isExpanded: !stage.collapsed,
    hasSyntaxError: hasSyntaxError(stage),
    hasServerError: !!stage.serverError,
    isAutoPreviewing: state.autoPreview,
  };
})(Stage);
