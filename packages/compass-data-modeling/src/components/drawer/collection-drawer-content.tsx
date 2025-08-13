import React, { useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
import type {
  Relationship,
  DataModelCollection,
} from '../../services/data-model-storage';
import {
  Badge,
  Button,
  IconButton,
  css,
  palette,
  spacing,
  TextInput,
  Icon,
  TextArea,
} from '@mongodb-js/compass-components';
import {
  addCollection,
  createNewRelationship,
  deleteRelationship,
  renameCollection,
  selectCurrentModelFromState,
  selectRelationship,
  updateCollectionNote,
} from '../../store/diagram';
import type { DataModelingState } from '../../store/reducer';
import { getDefaultRelationshipName } from '../../utils';
import {
  DMDrawerSection,
  DMFormFieldContainer,
} from './drawer-section-components';
import { useChangeOnBlur } from './use-change-on-blur';

type CollectionDrawerContentProps = {
  namespace?: string;
  collections: DataModelCollection[];
  note?: string;
  relationships: Relationship[];
  onCreateNewRelationshipClick: (namespace: string) => void;
  onEditRelationshipClick: (rId: string) => void;
  onDeleteRelationshipClick: (rId: string) => void;
  onNoteChange: (namespace: string, note: string) => void;
  onRenameCollection: (fromNS: string, toNS: string) => void;
  onCreateCollection: (ns: string, position?: [number, number]) => void;
};

const titleBtnStyles = css({
  marginLeft: 'auto',
  maxHeight: 20, // To match accordion line height
});

const emptyRelationshipMessageStyles = css({
  color: palette.gray.dark1,
});

const relationshipsListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const relationshipItemStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const relationshipNameStyles = css({
  flexGrow: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
  paddingRight: spacing[200],
});

const relationshipContentStyles = css({
  marginTop: spacing[400],
});

export function getIsCollectionNameValid(
  collectionName: string,
  namespaces: string[],
  namespace?: string
): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (collectionName.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'Collection name cannot be empty.',
    };
  }

  const namespacesWithoutCurrent = namespaces.filter((ns) => ns !== namespace);

  const isDuplicate = namespacesWithoutCurrent.some((ns) => {
    const database = namespace ? toNS(namespace).database : toNS(ns).database;
    return ns.trim() === `${database}.${collectionName.trim()}`.trim();
  });

  return {
    isValid: !isDuplicate,
    errorMessage: isDuplicate ? 'Collection name must be unique.' : undefined,
  };
}

const CollectionDrawerContent: React.FunctionComponent<
  CollectionDrawerContentProps
> = ({
  namespace,
  collections,
  note = '',
  relationships,
  onCreateNewRelationshipClick,
  onEditRelationshipClick,
  onDeleteRelationshipClick,
  onNoteChange,
  onRenameCollection,
  onCreateCollection,
}) => {
  const namespaces = useMemo(() => {
    return collections.map((c) => c.ns);
  }, [collections]);
  const database = useMemo(() => toNS(namespaces[0]).database, [namespaces]); // TODO: what if there are no namespaces?

  const { value: collectionName, ...nameInputProps } = useChangeOnBlur(
    namespace ? toNS(namespace).collection : 'new-collection',
    (collectionName) => {
      const trimmedName = collectionName.trim();
      if (!isCollectionNameValid) {
        return;
      }
      if (!namespace) {
        onCreateCollection(`${database}.${trimmedName}`);
        return;
      }
      if (trimmedName === toNS(namespace).collection) {
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
    () => getIsCollectionNameValid(collectionName, namespaces, namespace),
    [collectionName, namespaces, namespace]
  );

  const noteInputProps = useChangeOnBlur(note, (newNote) => {
    if (namespace) onNoteChange(namespace, newNote);
  });

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!namespace) {
      nameInputRef.current?.focus();
    }
  }, [namespace]);

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

      <DMDrawerSection
        label={
          <>
            Relationships&nbsp;
            <Badge>{relationships.length}</Badge>
            <Button
              className={titleBtnStyles}
              size="xsmall"
              disabled={!namespace}
              onClick={() => {
                if (namespace) onCreateNewRelationshipClick(namespace);
              }}
            >
              Add relationship
            </Button>
          </>
        }
      >
        <div className={relationshipContentStyles}>
          {!relationships.length ? (
            <div className={emptyRelationshipMessageStyles}>
              This collection does not have any relationships yet.
            </div>
          ) : (
            <ul className={relationshipsListStyles}>
              {relationships.map((r) => {
                const relationshipLabel = getDefaultRelationshipName(
                  r.relationship
                );

                return (
                  <li
                    key={r.id}
                    data-relationship-id={r.id}
                    className={relationshipItemStyles}
                  >
                    <span
                      className={relationshipNameStyles}
                      title={relationshipLabel}
                    >
                      {relationshipLabel}
                    </span>
                    <IconButton
                      aria-label="Edit relationship"
                      title="Edit relationship"
                      onClick={() => {
                        onEditRelationshipClick(r.id);
                      }}
                    >
                      <Icon glyph="Edit" />
                    </IconButton>
                    <IconButton
                      aria-label="Delete relationship"
                      title="Delete relationship"
                      onClick={() => {
                        onDeleteRelationshipClick(r.id);
                      }}
                    >
                      <Icon glyph="Trash" />
                    </IconButton>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DMDrawerSection>

      <DMDrawerSection label="Notes">
        <DMFormFieldContainer>
          <TextArea
            label=""
            aria-label="Notes"
            disabled={!namespace}
            {...noteInputProps}
          ></TextArea>
        </DMFormFieldContainer>
      </DMDrawerSection>
    </>
  );
};

export default connect(
  (state: DataModelingState, ownProps: { namespace?: string }) => {
    const model = selectCurrentModelFromState(state);
    const collection = model.collections.find((collection) => {
      return collection.ns === ownProps.namespace;
    });
    return {
      note: collection?.note,
      namespace: collection?.ns,
      collections: model.collections,
      relationships: model.relationships.filter((r) => {
        const [local, foreign] = r.relationship;
        return (
          local.ns === ownProps.namespace || foreign.ns === ownProps.namespace
        );
      }),
    };
  },
  {
    onCreateNewRelationshipClick: createNewRelationship,
    onEditRelationshipClick: selectRelationship,
    onDeleteRelationshipClick: deleteRelationship,
    onNoteChange: updateCollectionNote,
    onRenameCollection: renameCollection,
    onCreateCollection: addCollection,
  }
)(CollectionDrawerContent);
