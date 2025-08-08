import React from 'react';
import { connect } from 'react-redux';
import type { Relationship } from '../../services/data-model-storage';
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
  createNewRelationship,
  deleteRelationship,
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
  namespace: string;
  relationships: Relationship[];
  onCreateNewRelationshipClick: (namespace: string) => void;
  onEditRelationshipClick: (rId: string) => void;
  onDeleteRelationshipClick: (rId: string) => void;
  note?: string;
  onNoteChange: (namespace: string, note: string) => void;
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

const CollectionDrawerContent: React.FunctionComponent<
  CollectionDrawerContentProps
> = ({
  namespace,
  relationships,
  onCreateNewRelationshipClick,
  onEditRelationshipClick,
  onDeleteRelationshipClick,
  note = '',
  onNoteChange,
}) => {
  const noteInputProps = useChangeOnBlur(note, (newNote) => {
    onNoteChange(namespace, newNote);
  });

  return (
    <>
      <DMDrawerSection label="Collection properties">
        <DMFormFieldContainer>
          <TextInput
            label="Name"
            sizeVariant="small"
            value={namespace}
            disabled={true}
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
                      {getDefaultRelationshipName(r.relationship)}
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
          <TextArea label="" aria-label="Notes" {...noteInputProps}></TextArea>
        </DMFormFieldContainer>
      </DMDrawerSection>
    </>
  );
};

export default connect(
  (state: DataModelingState, ownProps: { namespace: string }) => {
    const model = selectCurrentModelFromState(state);
    return {
      note:
        model.collections.find((collection) => {
          return collection.ns === ownProps.namespace;
        })?.note ?? '',
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
  }
)(CollectionDrawerContent);
