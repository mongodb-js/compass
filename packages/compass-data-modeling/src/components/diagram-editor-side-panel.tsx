import React from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { closeSidePanel } from '../store/side-panel';
import {
  Button,
  css,
  cx,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import CollectionDrawerContent from './collection-drawer-content';
import RelationshipDrawerContent from './relationship-drawer-content';

const containerStyles = css({
  width: '400px',
  height: '100%',
  borderLeft: `1px solid ${palette.gray.light2}`,
});

const darkModeContainerStyles = css({
  borderLeftColor: palette.gray.dark2,
});

type DiagramEditorSidePanelProps = {
  selectedItems: { type: 'relationship' | 'collection'; id: string } | null;
  onClose: () => void;
};

function DiagmramEditorSidePanel({
  selectedItems,
  onClose,
}: DiagramEditorSidePanelProps) {
  const isDarkMode = useDarkMode();

  if (!selectedItems) {
    return null;
  }

  let content;

  if (selectedItems.type === 'collection') {
    content = (
      <CollectionDrawerContent
        namespace={selectedItems.id}
      ></CollectionDrawerContent>
    );
  } else if (selectedItems.type === 'relationship') {
    content = <RelationshipDrawerContent></RelationshipDrawerContent>;
  }

  return (
    <div className={cx(containerStyles, isDarkMode && darkModeContainerStyles)}>
      {content}
      <Button onClick={onClose} variant="primary" size="small">
        Close Side Panel
      </Button>
    </div>
  );
}

export default connect(
  (state: DataModelingState) => {
    return {
      selectedItems: state.diagram?.selectedItems ?? null,
    };
  },
  {
    onClose: closeSidePanel,
  }
)(DiagmramEditorSidePanel);
