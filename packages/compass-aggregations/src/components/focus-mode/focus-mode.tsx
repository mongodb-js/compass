import React from 'react';
import {
  Modal,
  css,
  spacing,
  palette,
  cx,
  useDarkMode,
  HorizontalRule,
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

const containerStyles = css({
  display: 'grid',
  gridTemplateRows: 'min-content 1fr',
  gridTemplateColumns: '1fr',
  overflow: 'hidden',
  padding: spacing[800],
  paddingBottom: 0,
  height: '100%',
});

const headerStyles = css({
  paddingBottom: spacing[200],
});

const bodyStyles = css({
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
});

const inputResizerStyles = css({
  paddingTop: spacing[600],
  paddingRight: spacing[200],
});

const outputResizerStyles = css({
  paddingTop: spacing[600],
  paddingLeft: spacing[200],
});

const previewAreaStyles = css({
  height: '100%',
});

const editorAreaBaseStyles = css({
  flex: 1,
  paddingTop: spacing[600],
});

const editorAreaDarkStyles = css({});

const editorAreaLightStyles = css({
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
  isAutoPreviewEnabled: boolean | undefined;
  onCloseModal: () => void;
};

const FocusModeContent = ({
  isAutoPreviewEnabled,
}: Pick<FocusModeProps, 'isAutoPreviewEnabled'>) => {
  const darkMode = useDarkMode();
  if (!isAutoPreviewEnabled) {
    return (
      <div className={bodyStyles}>
        <div
          className={cx(
            editorAreaBaseStyles,
            editorAreaExpanded,
            darkMode ? editorAreaDarkStyles : editorAreaLightStyles
          )}
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
        }}
      >
        <div className={previewAreaStyles} data-testid="stage-input">
          <FocusModeStageInput />
        </div>
      </Resizable>
      <div
        className={cx(
          editorAreaBaseStyles,
          editorAreaWithPreviewStyles,
          darkMode ? editorAreaDarkStyles : editorAreaLightStyles
        )}
        data-testid="stage-editor"
      >
        <FocusModeStageEditor />
      </div>
      <Resizable
        defaultSize={{
          width: '25%',
          height: 'auto',
        }}
        minWidth={'15%'}
        maxWidth={'40%'}
        className={outputResizerStyles}
        enable={{
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
      setOpen={onCloseModal}
      open={isModalOpen}
      data-testid={'focus-mode-modal'}
      fullScreen
    >
      <div className={containerStyles}>
        <div>
          <div className={headerStyles}>
            <FocusModeModalHeader></FocusModeModalHeader>
          </div>
          <HorizontalRule />
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
