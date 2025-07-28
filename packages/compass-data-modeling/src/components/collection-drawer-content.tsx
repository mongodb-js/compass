import React from 'react';
import { connect } from 'react-redux';
import type { Relationship } from '../services/data-model-storage';
import {
  Accordion,
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
} from '../store/diagram';
import type { DataModelingState } from '../store/reducer';
import { getRelationshipName } from '../utils';

type CollectionDrawerContentProps = {
  namespace: string;
  relationships: Relationship[];
  shouldShowRelationshipEditingForm?: boolean;
  onCreateNewRelationshipClick: (namespace: string) => void;
  onEditRelationshipClick: (rId: string) => void;
  onDeleteRelationshipClick: (rId: string) => void;
};

const formFieldContainerStyles = css({
  marginBottom: spacing[400],
  marginTop: spacing[400],
});

const containerStyles = css({
  padding: spacing[400],
});

const accordionTitleStyles = css({
  fontSize: spacing[300],
  width: '100%',
});

const relationshipsTitleStyles = css({
  width: '100%',
  display: 'flex',
});

const titleBtnStyles = css({
  marginLeft: 'auto',
});

const emptyRelationshipMessageStyles = css({
  color: palette.gray.dark1,
});
const relationshipItemStyles = css({
  display: 'flex',
});

const relationshipNameStyles = css({
  flexGrow: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});

const relationshipContentStyles = css({
  margin: `${spacing[400]}px 0`,
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
    <div className={containerStyles}>
      <Accordion
        text="COLLECTION"
        defaultOpen={true}
        textClassName={accordionTitleStyles}
      >
        <FormFieldContainer className={formFieldContainerStyles}>
          <TextInput
            label="Name"
            sizeVariant="small"
            value={namespace}
            disabled={true}
          />
        </FormFieldContainer>
      </Accordion>

      <Accordion
        text={
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
        defaultOpen={true}
        textClassName={accordionTitleStyles}
        buttonTextClassName={relationshipsTitleStyles}
      >
        <div className={relationshipContentStyles}>
          {!relationships.length ? (
            <div className={emptyRelationshipMessageStyles}>
              This collection does not have any relationships yet.
            </div>
          ) : (
            <ul>
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
      </Accordion>
    </div>
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
