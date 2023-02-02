import React from 'react';
import {
  Modal,
  css,
  spacing,
  palette,
  cx,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import type { RootState } from '../../modules';
import { disableFocusMode } from '../../modules/focus-mode';
import FocusModeStageEditor from './focus-mode-stage-editor';
import {
  FocusModeStageInput,
  FocusModeStageOutput,
} from './focus-mode-stage-preview';
import FocusModeModalHeader from './focus-mode-modal-header';
import ResizeHandle from '../resize-handle';
import { Resizable } from 're-resizable';

// These styles make the modal occupy the whole screen,
// with 18px of padding - because that's the
// default padding for the modal (left and right).
const modalStyles = css({
  '> div': {
    height: '100%',
    padding: '18px',
  },
  '[role="dialog"]': {
    width: '100%',
    height: '100%',
    // LG sets maxHeight to calc(100% - 64px). This enables modal
    // to occupy the whole screen.
    maxHeight: '100%',
    '> div': {
      height: '100%',
    },
  },
});

const containerStyles = css({
  display: 'grid',
  gridTemplateRows: 'min-content 1fr',
  gridTemplateColumns: '1fr',
  overflow: 'hidden',
  padding: spacing[5],
  paddingBottom: 0,
  height: '100%',
});

const headerStyles = css({
  borderBottom: `1px solid ${palette.gray.light2}`,
  paddingBottom: spacing[2],
});

const bodyStyles = css({
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
});


const inputResizerStyles = css({
  paddingTop: spacing[4],
  paddingRight: spacing[2],
});

const outputResizerStyles = css({
  paddingTop: spacing[4],
  paddingLeft: spacing[2],
});

const previewAreaStyles = css({
  height: '100%',
});

const editorAreaBaseStyles = css({
  flex: 1,
  paddingTop: spacing[4],
  backgroundColor: palette.gray.light3,
});

const editorAreaWithPreviewStyles = css({
  width: '50%',
  minWidth: '20%',
  maxWidth: '70%',
});

const editorAreaExpanded = css({
  width: '100%',
});

type FocusModeProps = {
  isModalOpen: boolean;
  isAutoPreviewEnabled: boolean;
  onCloseModal: () => void;
};

const FocusModeContent = ({
  isAutoPreviewEnabled,
}: {
  isAutoPreviewEnabled: boolean;
}) => {
  if (!isAutoPreviewEnabled) {
    return (
      <div className={bodyStyles}>
        <div
          className={cx(editorAreaBaseStyles, editorAreaExpanded)}
          data-testid="stage-editor"
        >
          <FocusModeStageEditor />
        </div>
      </div>
    );
  }
  return (
    <div className={bodyStyles}>
      <Resizable
        defaultSize={{
          width: '25%',
          height: 'auto',
        }}
        minWidth={'15%'}
        maxWidth={'40%'}
        className={inputResizerStyles}
        enable={{
          right: true,
        }}
        handleComponent={{
          right: <ResizeHandle />,
        }}
        handleStyles={{
          right: {
            right: '-9px', // default -5px
          },
        }}>
        <div className={previewAreaStyles} data-testid="stage-input">
          <FocusModeStageInput />
        </div>
      </Resizable>
      <div
        className={cx(editorAreaBaseStyles, editorAreaWithPreviewStyles)}
        data-testid="stage-editor"
      >
        <FocusModeStageEditor />
      </div>
      <Resizable
        defaultSize= {{
          width: '25%',
          height: 'auto',
        }}
        minWidth={'15%'}
        maxWidth={'40%'}
        className={outputResizerStyles}
        enable= {{
          left: true,
        }}
        handleComponent={{
          left: <ResizeHandle />,
        }}
        handleStyles={{
          left: {
            left: '-1px', // default -5px
          },
        }}
      >
        <div className={previewAreaStyles} data-testid="stage-output">
          <FocusModeStageOutput />
        </div>
      </Resizable>
    </div>
  );
};

export const FocusMode: React.FunctionComponent<FocusModeProps> = ({
  isModalOpen,
  isAutoPreviewEnabled,
  onCloseModal,
}) => {
  return (
    <Modal
      className={modalStyles}
      setOpen={onCloseModal}
      open={isModalOpen}
      data-testid={'focus-mode-modal'}
    >
      <div className={containerStyles}>
        <div className={headerStyles}>
          <FocusModeModalHeader></FocusModeModalHeader>
        </div>
        <FocusModeContent isAutoPreviewEnabled={isAutoPreviewEnabled} />
      </div>
    </Modal>
  );
};

const mapState = ({ focusMode: { isEnabled }, autoPreview }: RootState) => ({
  isModalOpen: isEnabled,
  isAutoPreviewEnabled: autoPreview,
});

const mapDispatch = {
  onCloseModal: disableFocusMode,
};
export default connect(mapState, mapDispatch)(FocusMode);
