import React, { useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
import type {
  DataModelCollection,
  Relationship,
} from '../../services/data-model-storage';
import { TextInput, TextArea } from '@mongodb-js/compass-components';
import {
  createNewRelationship,
  deleteRelationship,
  renameCollection,
  selectCurrentModelFromState,
  selectRelationship,
  updateCollectionNote,
} from '../../store/diagram';
import type { DataModelingState } from '../../store/reducer';
import {
  DMDrawerSection,
  DMFormFieldContainer,
} from './drawer-section-components';
import { useChangeOnBlur } from './use-change-on-blur';
import { RelationshipsSection } from './relationships-section';
import { getNamespaceRelationships } from '../../utils/utils';
import { getIsNewNameValid } from './util';

type CollectionDrawerContentProps = {
  namespace: string;
  collections: DataModelCollection[];
  note?: string;
  relationships: Relationship[];
  isDraftCollection?: boolean;
  onCreateNewRelationshipClick: ({
    localNamespace,
  }: {
    localNamespace: string;
  }) => void;
  onEditRelationshipClick: (rId: string) => void;
  onDeleteRelationshipClick: (rId: string) => void;
  onNoteChange: (namespace: string, note: string) => void;
  onRenameCollection: (fromNS: string, toNS: string) => void;
};

const CollectionDrawerContent: React.FunctionComponent<
  CollectionDrawerContentProps
> = ({
  namespace,
  collections,
  note = '',
  relationships,
  isDraftCollection,
  onCreateNewRelationshipClick,
  onEditRelationshipClick,
  onDeleteRelationshipClick,
  onNoteChange,
  onRenameCollection,
}) => {
  const namespaces = useMemo(() => {
    return collections.map((c) => c.ns);
  }, [collections]);
  const { value: collectionName, ...nameInputProps } = useChangeOnBlur(
    toNS(namespace).collection,
    (collectionName) => {
      const trimmedName = collectionName.trim();
      if (!isCollectionNameValid) {
        return;
      }
      if (!isDraftCollection && trimmedName === toNS(namespace).collection) {
        return;
      }
      onRenameCollection(
        namespace,
        `${toNS(namespace).database}.${trimmedName}`
      );
    }
  );

  const {
    isValid: isCollectionNameValid,
    errorMessage: collectionNameEditErrorMessage,
  } = useMemo(
    () =>
      getIsNewNameValid({
        newName: collectionName,
        existingNames: namespaces.map((ns) => toNS(ns).collection),
        currentName: toNS(namespace).collection,
        entity: 'Collection',
      }),
    [collectionName, namespaces, namespace]
  );

  const noteInputProps = useChangeOnBlur(note, (newNote) => {
    onNoteChange(namespace, newNote);
  });

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (isDraftCollection) {
      nameInputRef.current?.focus();
    }
  }, [isDraftCollection]);

  return (
    <>
      <DMDrawerSection label="Collection properties">
        <DMFormFieldContainer>
          <TextInput
            ref={nameInputRef}
            label="Name"
            data-testid="data-model-collection-drawer-name-input"
            sizeVariant="small"
            value={collectionName}
            {...nameInputProps}
            state={isCollectionNameValid ? undefined : 'error'}
            errorMessage={collectionNameEditErrorMessage}
          />
        </DMFormFieldContainer>
      </DMDrawerSection>
      <RelationshipsSection
        relationships={relationships}
        emptyMessage="This collection does not have any relationships yet."
        onCreateNewRelationshipClick={() => {
          onCreateNewRelationshipClick({ localNamespace: namespace });
        }}
        onEditRelationshipClick={onEditRelationshipClick}
        onDeleteRelationshipClick={onDeleteRelationshipClick}
      />

      <DMDrawerSection label="Notes">
        <DMFormFieldContainer>
          <TextArea label="" aria-label="Notes" {...noteInputProps}></TextArea>
        </DMFormFieldContainer>
      </DMDrawerSection>
    </>
  );
};

export default connect(
  (state: DataModelingState, ownProps: { namespace: string }) => {
    const model = selectCurrentModelFromState(state);
    const collection = model.collections.find((collection) => {
      return collection.ns === ownProps.namespace;
    });
    if (!collection) {
      throw new Error('Namespace not found in model: ' + ownProps.namespace);
    }
    return {
      note: collection.note,
      namespace: collection.ns,
      isDraftCollection: state.diagram?.draftCollection === ownProps.namespace,
      collections: model.collections,
      relationships: getNamespaceRelationships(
        ownProps.namespace,
        model.relationships
      ),
    };
  },
  {
    onCreateNewRelationshipClick: createNewRelationship,
    onEditRelationshipClick: selectRelationship,
    onDeleteRelationshipClick: deleteRelationship,
    onNoteChange: updateCollectionNote,
    onRenameCollection: renameCollection,
  }
)(CollectionDrawerContent);
