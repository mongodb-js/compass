import React from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { DrawerSection } from '@mongodb-js/compass-components';
import CollectionDrawerContent from './collection-drawer-content';
import RelationshipDrawerContent from './relationship-drawer-content';
import { closeDrawer } from '../store/diagram';

export const DATA_MODELING_DRAWER_ID = 'data-modeling-drawer';

type DiagramEditorSidePanelProps = {
  selectedItems: { type: 'relationship' | 'collection'; id: string } | null;
  onClose: () => void;
};

function DiagmramEditorSidePanel({
  selectedItems,
}: DiagramEditorSidePanelProps) {
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
    content = (
      <RelationshipDrawerContent
        relationshipId={selectedItems.id}
      ></RelationshipDrawerContent>
    );
  }

  return (
    <DrawerSection
      id={DATA_MODELING_DRAWER_ID}
      title="Details"
      label="Details"
      glyph="InfoWithCircle"
      autoOpen
      // TODO: Leafygreen doesn't allow us to tie close event to a particular
      // action. We can add this functionality ourselves, but I'm not sure that
      // adding even more logic on top of the drawer is a good idea. Maybe we're
      // okay with the drawer close button click just staying there until you
      // explicitly click something else?
      // onClose={onClose}
    >
      {content}
    </DrawerSection>
  );
}

export default connect(
  (state: DataModelingState) => {
    return {
      selectedItems: state.diagram?.selectedItems ?? null,
    };
  },
  {
    onClose: closeDrawer,
  }
)(DiagmramEditorSidePanel);
