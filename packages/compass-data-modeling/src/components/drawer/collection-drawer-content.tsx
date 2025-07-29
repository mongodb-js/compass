import React from 'react';
import { connect } from 'react-redux';
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
} from '../../store/diagram';
import type { DataModelingState } from '../../store/reducer';
import { getRelationshipName } from '../../utils';
import DMDrawerSection from './dm-drawer-section';

type CollectionDrawerContentProps = {
  namespace: string;
  relationships: Relationship[];
  onCreateNewRelationshipClick: (namespace: string) => void;
  onEditRelationshipClick: (rId: string) => void;
  onDeleteRelationshipClick: (rId: string) => void;
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

const CollectionDrawerContent: React.FunctionComponent<
  CollectionDrawerContentProps
> = ({
  namespace,
  relationships,
  onCreateNewRelationshipClick,
  onEditRelationshipClick,
  onDeleteRelationshipClick,
}) => {
  return (
    <>
      <DMDrawerSection label="COLLECTION">
        <FormFieldContainer className={formFieldContainerStyles}>
          <TextInput
            label="Name"
            sizeVariant="small"
            value={namespace}
            disabled={true}
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
    return {
      relationships: selectCurrentModel(
        getCurrentDiagramFromState(state).edits
      ).relationships.filter((r) => {
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
  }
)(CollectionDrawerContent);
