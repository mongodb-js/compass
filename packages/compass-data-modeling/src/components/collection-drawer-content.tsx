import React from 'react';
import { connect } from 'react-redux';
import type { Relationship } from '../services/data-model-storage';
import { Button, H3 } from '@mongodb-js/compass-components';
import {
  createNewRelationship,
  deleteRelationship,
  getCurrentDiagramFromState,
  selectCurrentModel,
  selectRelationship,
} from '../store/diagram';
import type { DataModelingState } from '../store/reducer';

type CollectionDrawerContentProps = {
  namespace: string;
  relationships: Relationship[];
  shouldShowRelationshipEditingForm?: boolean;
  onCreateNewRelationshipClick: (namespace: string) => void;
  onEditRelationshipClick: (rId: string) => void;
  onDeleteRelationshipClick: (rId: string) => void;
};

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
      <H3>{namespace}</H3>
      <ul>
        {relationships.map((r) => {
          return (
            <li key={r.id} data-relationship-id={r.id}>
              {r.relationship[0].fields?.join('.')}&nbsp;-&gt;&nbsp;
              {r.relationship[1].fields?.join('.')}
              <Button
                onClick={() => {
                  onEditRelationshipClick(r.id);
                }}
              >
                Edit
              </Button>
              <Button
                onClick={() => {
                  onDeleteRelationshipClick(r.id);
                }}
              >
                Delete
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        onClick={() => {
          onCreateNewRelationshipClick(namespace);
        }}
      >
        Add relationship manually
      </Button>
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
