import React from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { closeSidePanel } from '../store/side-panel';
import {
  Button,
  css,
  cx,
  Body,
  spacing,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  width: '400px',
  height: '100%',

  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[400],
  borderLeft: `1px solid ${palette.gray.light2}`,
});

const darkModeContainerStyles = css({
  borderLeftColor: palette.gray.dark2,
});

type DiagramEditorSidePanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

function DiagmramEditorSidePanel({
  isOpen,
  onClose,
}: DiagramEditorSidePanelProps) {
  const isDarkMode = useDarkMode();
  if (!isOpen) {
    return null;
  }
  return (
    <div className={cx(containerStyles, isDarkMode && darkModeContainerStyles)}>
      <Body>This feature is under development.</Body>
      <Button onClick={onClose} variant="primary" size="small">
        Close Side Panel
      </Button>
    </div>
  );
}

export default connect(
  (state: DataModelingState) => {
    const { sidePanel } = state;
    return {
      isOpen: sidePanel.isOpen,
    };
  },
  {
    onClose: closeSidePanel,
  }
)(DiagmramEditorSidePanel);
