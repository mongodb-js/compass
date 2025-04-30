import React from 'react';
import { connect } from 'react-redux';
import { createNewDiagram } from '../store/generate-diagram-wizard';
import {
  Button,
  Card,
  EmptyContent,
  Icon,
  ItemActionMenu,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import { useDataModelSavedItems } from '../provider';
import { deleteDiagram, openDiagram, renameDiagram } from '../store/diagram';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';

const SavedDiagramsList: React.FunctionComponent<{
  onCreateDiagramClick: () => void;
  onOpenDiagramClick: (diagram: MongoDBDataModelDescription) => void;
  onDiagramDeleteClick: (id: string) => void;
  onDiagramRenameClick: (id: string) => void;
}> = ({
  onCreateDiagramClick,
  onOpenDiagramClick,
  onDiagramRenameClick,
  onDiagramDeleteClick,
}) => {
  const { items, status } = useDataModelSavedItems();

  if (status === 'INITIAL' || status === 'LOADING') {
    return null;
  }

  const showList = items.length > 0;

  let content;

  if (showList) {
    content = (
      <div>
        {items.map((diagram) => {
          return (
            <Card
              style={{ marginTop: 8, display: 'flex' }}
              key={diagram.id}
              onClick={() => {
                onOpenDiagramClick(diagram);
              }}
            >
              {diagram.name}
              <ItemActionMenu
                isVisible
                actions={[
                  { action: 'rename', label: 'Rename' },
                  { action: 'delete', label: 'Delete' },
                ]}
                onAction={(action) => {
                  if (action === 'rename') {
                    onDiagramRenameClick(diagram.id);
                  }
                  if (action === 'delete') {
                    onDiagramDeleteClick(diagram.id);
                  }
                }}
              ></ItemActionMenu>
            </Card>
          );
        })}
      </div>
    );
  } else {
    content = (
      <EmptyContent
        icon={() => <Icon size={80} glyph="Diagram"></Icon>}
        title="Design, Visualize, and Evolve your Data Model"
        subTitle={
          <>
            Your data model is the foundation of application performance. As
            applications evolve, so must your schema—intelligently and
            strategically. Minimize complexity, prevent performance bottlenecks,
            and keep your development agile.
          </>
        }
        callToAction={
          <Button
            onClick={onCreateDiagramClick}
            variant="primary"
            data-testid="create-diagram-button"
          >
            Create diagram
          </Button>
        }
      ></EmptyContent>
    );
  }

  return (
    <WorkspaceContainer
      toolbar={() => {
        return showList ? (
          <>
            <Button
              onClick={onCreateDiagramClick}
              variant="primary"
              size="xsmall"
              data-testid="create-diagram-button"
            >
              Create diagram
            </Button>
          </>
        ) : null;
      }}
    >
      {content}
    </WorkspaceContainer>
  );
};

export default connect(null, {
  onCreateDiagramClick: createNewDiagram,
  onOpenDiagramClick: openDiagram,
  onDiagramDeleteClick: deleteDiagram,
  onDiagramRenameClick: renameDiagram,
})(SavedDiagramsList);
