import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
import type { Relationship } from '../../services/data-model-storage';
import {
  Badge,
  Button,
  IconButton,
  css,
  FormFieldContainer,
  palette,
  spacing,
  TextInput,
  Icon,
} from '@mongodb-js/compass-components';
import {
  createNewRelationship,
  deleteRelationship,
  getCurrentDiagramFromState,
  selectCurrentModel,
  selectRelationship,
  renameCollection,
} from '../../store/diagram';
import type { DataModelingState } from '../../store/reducer';
import { getRelationshipName } from '../../utils';
import DMDrawerSection from './dm-drawer-section';

type CollectionDrawerContentProps = {
  namespace: string;
  namespaces: string[];
  relationships: Relationship[];
  onCreateNewRelationshipClick: (namespace: string) => void;
  onEditRelationshipClick: (rId: string) => void;
  onDeleteRelationshipClick: (rId: string) => void;
  onRenameCollection: (fromNS: string, toNS: string) => void;
};

const formFieldContainerStyles = css({
  marginBottom: spacing[400],
  marginTop: spacing[400],
});

const titleBtnStyles = css({
  marginLeft: 'auto',
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
  namespace: string
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

  const isDuplicate = namespacesWithoutCurrent.some(
    (ns) =>
      ns === `${toNS(namespace).database}.${collectionName}` ||
      ns === `${toNS(namespace).database}.${collectionName.trim()}`
  );

  return {
    isValid: !isDuplicate,
    errorMessage: isDuplicate ? 'Collection name must be unique.' : undefined,
  };
}

const CollectionDrawerContent: React.FunctionComponent<
  CollectionDrawerContentProps
> = ({
  namespace,
  namespaces,
  relationships,
  onCreateNewRelationshipClick,
  onEditRelationshipClick,
  onDeleteRelationshipClick,
  onRenameCollection,
}) => {
  const [collectionName, setCollectionName] = useState(
    () => toNS(namespace).collection
  );

  const {
    isValid: isCollectionNameValid,
    errorMessage: collectionNameEditErrorMessage,
  } = useMemo(
    () => getIsCollectionNameValid(collectionName, namespaces, namespace),
    [collectionName, namespaces, namespace]
  );

  useLayoutEffect(() => {
    setCollectionName(toNS(namespace).collection);
  }, [namespace]);

  const onBlurCollectionName = useCallback(() => {
    const trimmedName = collectionName.trim();
    if (trimmedName === toNS(namespace).collection) {
      return;
    }

    if (!isCollectionNameValid) {
      // Reset to previous valid name.
      // TODO: Maybe we don't reset.
      setCollectionName(toNS(namespace).collection);
      return;
    }

    onRenameCollection(namespace, `${toNS(namespace).database}.${trimmedName}`);
  }, [collectionName, namespace, onRenameCollection, isCollectionNameValid]);

  return (
    <>
      <DMDrawerSection label="COLLECTION">
        <FormFieldContainer className={formFieldContainerStyles}>
          <TextInput
            label="Name"
            sizeVariant="small"
            value={collectionName}
            state={isCollectionNameValid ? undefined : 'error'}
            errorMessage={collectionNameEditErrorMessage}
            onChange={(e) => {
              setCollectionName(e.target.value);
            }}
            onBlur={onBlurCollectionName}
          />
        </FormFieldContainer>
      </DMDrawerSection>

      <DMDrawerSection
        label={
          <>
            RELATIONSHIPS&nbsp;
            <Badge>{relationships.length}</Badge>
            <Button
              className={titleBtnStyles}
              size="xsmall"
              onClick={() => {
                onCreateNewRelationshipClick(namespace);
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
                return (
                  <li
                    key={r.id}
                    data-relationship-id={r.id}
                    className={relationshipItemStyles}
                  >
                    <span className={relationshipNameStyles}>
                      {getRelationshipName(r)}
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
    </>
  );
};

export default connect(
  (state: DataModelingState, ownProps: { namespace: string }) => {
    const model = selectCurrentModel(getCurrentDiagramFromState(state).edits);
    return {
      relationships: model.relationships.filter((r) => {
        const [local, foreign] = r.relationship;
        return (
          local.ns === ownProps.namespace || foreign.ns === ownProps.namespace
        );
      }),
      namespaces: model.collections.map((c) => c.ns),
    };
  },
  {
    onCreateNewRelationshipClick: createNewRelationship,
    onEditRelationshipClick: selectRelationship,
    onDeleteRelationshipClick: deleteRelationship,
    onRenameCollection: renameCollection,
  }
)(CollectionDrawerContent);
