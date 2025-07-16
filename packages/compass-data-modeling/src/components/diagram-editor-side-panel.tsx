import React, { useEffect } from 'react';
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
  DrawerLayout,
  DrawerDisplayMode,
  useDrawerToolbarContext,
  Drawer,
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

const DRAWER_TOOLBAR_DATA: DrawerLayoutProps['toolbarData'] = [
  {
    id: 'Code',
    label: 'Code',
    content: <DrawerContent />,
    title: 'Code Title',
    glyph: 'Code',
    onClick: () => {
      console.log('Code clicked');
    },
  },
];

function DiagmramEditorSidePanel({
  isOpen,
  onClose,
}: DiagramEditorSidePanelProps) {
  const isDarkMode = useDarkMode();
  // const { openDrawer } = useDrawerToolbarContext();

  // useEffect(() => {
  //   if (isOpen) {
  //     console.log('OPENING SIDE PANEL');
  //     openDrawer("DiagramEditorSidePanel");
  //   }
  // }, [isOpen, openDrawer]);

  return (
    <div className={cx(containerStyles, isDarkMode && darkModeContainerStyles)}>
      <Drawer title="Diagram Editor" open={isOpen} onClose={onClose}>
        <Body>Under development...</Body>
        <Button onClick={onClose}>Close</Button>
      </Drawer>
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
