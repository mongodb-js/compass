import React from 'react';
import { connect } from 'react-redux';
import { sortableHandle } from 'react-sortable-hoc';
import { Resizable } from 're-resizable';

import { KeylineCard, css, cx, spacing, palette } from '@mongodb-js/compass-components';

import type { RootState } from '../modules';

import ResizeHandle from './resize-handle';
import StageEditorToolbar from './stage-editor-toolbar';
import StageEditor from './stage-editor';
import StagePreview from './stage-preview';
import StagePreviewToolbar from './stage-preview-toolbar';

const DragHandleToolbar = sortableHandle((props: { index: number }) => {
  return <StageEditorToolbar {...props}></StageEditorToolbar>
});

const stageStyles = css({
  position: 'relative',
  margin: spacing[3],
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  overflow: 'hidden' // this is so that the top left red border corner does not get cut off when there's a server error
});

const stageErrorStyles = css({
  borderColor: palette.red.base
});

const stageEditorNoPreviewStyles = css({
  width: '100%'
});

const stagePreviewContainerStyles = css({
  display: 'flex',
  position: 'relative',
  flexDirection: 'column',
  width: '100%',
  overflow: 'auto'
});

const RESIZABLE_DIRECTIONS = {
  top: false,
  right: true,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false
};

type ResizableEditorProps = {
  index: number,
  isExpanded: boolean,
  isAutoPreviewing: boolean,
};

function ResizableEditor({ index, isExpanded, isAutoPreviewing }: ResizableEditorProps) {
  const editor = (
    <>
      <DragHandleToolbar index={index} />
      {isExpanded && (
        <StageEditor index={index} />
      )}
    </>
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
    >
      {editor}
    </Resizable>
  );
}

const DEFAULT_OPACITY = 0.6;

type StageProps = {
  index: number,
  isEnabled: boolean,
  isExpanded: boolean,
  hasServerError: boolean,
  isAutoPreviewing: boolean
}

function Stage({
  index,
  isEnabled,
  isExpanded,
  hasServerError,
  isAutoPreviewing
}: StageProps) {
  const opacity = isEnabled ? 1 : DEFAULT_OPACITY;

  return (<KeylineCard className={cx(stageStyles, hasServerError && stageErrorStyles)} style={{ opacity }}>
    <ResizableEditor index={index} isExpanded={isExpanded} isAutoPreviewing={isAutoPreviewing} />
    {isAutoPreviewing && (<div className={stagePreviewContainerStyles}>
      <StagePreviewToolbar index={index} />
      {isExpanded && (
        <StagePreview index={index} />
      )}
    </div>)}
  </KeylineCard>);
}


type StageOwnProps = {
  index: number
};

export default connect((state: RootState, ownProps: StageOwnProps) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index]
  return {
    isEnabled: !stage.disabled,
    isExpanded: !stage.collapsed,
    hasServerError: !!stage.serverError,
    isAutoPreviewing: state.autoPreview
  };
}, null)(Stage);
