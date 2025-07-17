import React from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import {
  css,
  cx,
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
});

const darkModeContainerStyles = css({
  borderLeftColor: palette.gray.dark2,
});

function DiagramEditorSidePanel() {
  const isDarkMode = useDarkMode();

  // TODO: this is a placeholder for the side panel content.

  return (
    <div className={cx(containerStyles, isDarkMode && darkModeContainerStyles)}>
      This feature is under development.
    </div>
  );
}

export default connect((state: DataModelingState) => {
  const { sidePanel } = state;
  return {
    isOpen: sidePanel.isOpen,
  };
})(DiagramEditorSidePanel);
