import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../../store/reducer';
import {
  css,
  DrawerSection,
  ItemActionControls,
} from '@mongodb-js/compass-components';
import CollectionDrawerContent from './collection-drawer-content';
import RelationshipDrawerContent from './relationship-drawer-content';
import {
  deleteCollection,
  deleteRelationship,
  selectCurrentModelFromState,
} from '../../store/diagram';
import { getDefaultRelationshipName } from '../../utils';

export const DATA_MODELING_DRAWER_ID = 'data-modeling-drawer';

const drawerTitleStyles = css({
  display: 'flex',
  width: '100%',
});

const drawerTitleTextStyles = css({
  flex: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const drawerTitleActionGroupStyles = css({});

type DiagramEditorSidePanelProps = {
  selectedItems: {
    id: string;
    type: 'relationship' | 'collection';
    label: string;
  } | null;
  onDeleteCollection: (ns: string) => void;
  onDeleteRelationship: (rId: string) => void;
};

function DiagramEditorSidePanel({
  selectedItems,
  onDeleteCollection,
  onDeleteRelationship,
}: DiagramEditorSidePanelProps) {
  const { content, label, actions, handleAction } = useMemo(() => {
    if (selectedItems?.type === 'collection') {
      return {
        label: selectedItems.label,
        content: (
          <CollectionDrawerContent
            key={selectedItems.id}
            namespace={selectedItems.id}
          ></CollectionDrawerContent>
        ),
        actions: [
          { action: 'delete', label: 'Delete', icon: 'Trash' as const },
        ],
        handleAction: (actionName: string) => {
          if (actionName === 'delete') {
            onDeleteCollection(selectedItems.id);
          }
        },
      };
    }

    if (selectedItems?.type === 'relationship') {
      return {
        label: selectedItems.label,
        content: (
          <RelationshipDrawerContent
            key={selectedItems.id}
            relationshipId={selectedItems.id}
          ></RelationshipDrawerContent>
        ),
        actions: [
          { action: 'delete', label: 'Delete', icon: 'Trash' as const },
        ],
        handleAction: (actionName: string) => {
          if (actionName === 'delete') {
            onDeleteRelationship(selectedItems.id);
          }
        },
      };
    }

    return { content: null };
  }, [selectedItems, onDeleteCollection, onDeleteRelationship]);

  if (!content) {
    return null;
  }

  return (
    <DrawerSection
      id={DATA_MODELING_DRAWER_ID}
      title={
        <div className={drawerTitleStyles}>
          <span className={drawerTitleTextStyles} title={label}>
            {label}
          </span>

          <ItemActionControls
            actions={actions}
            iconSize="small"
            data-testid="data-modeling-drawer-actions"
            onAction={handleAction}
            className={drawerTitleActionGroupStyles}
            // Because the close button here is out of our control, we have do
            // adjust the actions rendering in a bit of an unconventional way:
            // if there's more than one action available, collapse it to "...",
            // if it's just one, make sure button is not collapsed by setting
            // collapseAfter to >0
            collapseAfter={actions.length > 1 ? 0 : 1}
          ></ItemActionControls>
        </div>
      }
      label={label}
      glyph="Wrench"
      autoOpen
    >
      {content}
    </DrawerSection>
  );
}

export default connect(
  (state: DataModelingState) => {
    const selected = state.diagram?.selectedItems;

    if (!selected) {
      return {
        selectedItems: null,
      };
    }

    const model = selectCurrentModelFromState(state);

    if (selected.type === 'collection') {
      const doesCollectionExist = model.collections.find((collection) => {
        return collection.ns === selected.id;
      });

      if (!doesCollectionExist) {
        // TODO(COMPASS-9680): When the selected collection doesn't exist then we
        // don't show any selection. We can get into this state with undo/redo.
        return {
          selectedItems: null,
        };
      }

      return {
        selectedItems: {
          ...selected,
          label: selected.id,
        },
      };
    }

    if (selected.type === 'relationship') {
      const relationship = model.relationships.find((relationship) => {
        return relationship.id === selected.id;
      });

      if (!relationship) {
        // TODO(COMPASS-9680): When the selected relationship doesn't exist we don't
        // show any selection. We can get into this state with undo/redo.
        return {
          selectedItems: null,
        };
      }

      return {
        selectedItems: {
          ...selected,
          label: getDefaultRelationshipName(relationship.relationship),
        },
      };
    }
  },
  {
    onDeleteCollection: deleteCollection,
    onDeleteRelationship: deleteRelationship,
  }
)(DiagramEditorSidePanel);
