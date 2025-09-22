import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
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
  removeField,
  selectCurrentModelFromState,
  type SelectedItems,
} from '../../store/diagram';
import { getDefaultRelationshipName } from '../../utils';
import FieldDrawerContent from './field-drawer-content';
import type { FieldPath } from '../../services/data-model-storage';
import { getFieldFromSchema } from '../../utils/schema-traversal';
import { isIdField } from '../../utils/utils';

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
  selectedItems: (SelectedItems & { label: string }) | null;
  onDeleteCollection: (ns: string) => void;
  onDeleteRelationship: (rId: string) => void;
  onDeleteField: (ns: string, fieldPath: FieldPath) => void;
};

const getCollection = (namespace: string) => toNS(namespace).collection;

function DiagramEditorSidePanel({
  selectedItems,
  onDeleteCollection,
  onDeleteRelationship,
  onDeleteField,
}: DiagramEditorSidePanelProps) {
  const { content, drawerIconLabel, label, actions, handleAction } =
    useMemo(() => {
      if (selectedItems?.type === 'collection') {
        return {
          label: selectedItems.label,
          drawerIconLabel: 'Collection Configuration',
          content: (
            <CollectionDrawerContent
              key={selectedItems.id}
              namespace={selectedItems.id}
            ></CollectionDrawerContent>
          ),
          actions: [
            {
              action: 'delete',
              label: 'Delete Collection',
              icon: 'Trash' as const,
            },
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
          drawerIconLabel: 'Relationship Configuration',
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

      if (selectedItems?.type === 'field') {
        return {
          label: selectedItems.label,
          drawerIconLabel: 'Field Configuration',
          content: (
            <FieldDrawerContent
              key={`${selectedItems.namespace}.${JSON.stringify(
                selectedItems.fieldPath
              )}`}
              namespace={selectedItems.namespace}
              fieldPath={selectedItems.fieldPath}
            ></FieldDrawerContent>
          ),
          actions: [
            ...(!isIdField(selectedItems.fieldPath)
              ? [
                  {
                    action: 'delete',
                    label: 'Delete Field',
                    icon: 'Trash' as const,
                  },
                ]
              : []),
          ],
          handleAction: (actionName: string) => {
            if (actionName === 'delete') {
              onDeleteField(selectedItems.namespace, selectedItems.fieldPath);
            }
          },
        };
      }

      return { content: null };
    }, [
      selectedItems,
      onDeleteCollection,
      onDeleteRelationship,
      onDeleteField,
    ]);

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
      label={drawerIconLabel}
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
          label: getCollection(selected.id),
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

    if (selected.type === 'field') {
      // TODO(COMPASS-9680): Can be cleaned up after COMPASS-9680 is done (the selection updates with undo/redo)
      const collection = model.collections.find(
        (collection) => collection.ns === selected.namespace
      );
      const field = getFieldFromSchema({
        jsonSchema: collection?.jsonSchema ?? {},
        fieldPath: selected.fieldPath,
      });
      if (!field) {
        return {
          selectedItems: null,
        };
      }

      return {
        selectedItems: {
          ...selected,
          label: `${getCollection(
            selected.namespace
          )}.${selected.fieldPath.join('.')}`,
        },
      };
    }
  },
  {
    onDeleteCollection: deleteCollection,
    onDeleteRelationship: deleteRelationship,
    onDeleteField: removeField,
  }
)(DiagramEditorSidePanel);
