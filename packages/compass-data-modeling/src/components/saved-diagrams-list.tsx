import React from 'react';
import { connect } from 'react-redux';
import { createNewDiagram } from '../store/generate-diagram-wizard';
import {
  Button,
  Card,
  css,
  EmptyContent,
  ItemActionMenu,
  Link,
  WorkspaceContainer,
  spacing,
} from '@mongodb-js/compass-components';
import { useDataModelSavedItems } from '../provider';
import { deleteDiagram, openDiagram, renameDiagram } from '../store/diagram';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import CollaborateIcon from './icons/collaborate';
import SchemaVisualizationIcon from './icons/schema-visualization';
import FlexibilityIcon from './icons/flexibility';
import InsightIcon from './icons/insight';

const subTitleStyles = css({
  maxWidth: '750px',
});

const featuresListStyles = css({
  display: 'flex',
  justifyContent: 'center',
  gap: spacing[600],
  marginTop: spacing[400],
});

const featureItemStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[400],
});

type Feature = 'visualization' | 'collaboration' | 'interactive' | 'insights';
const featureDescription: Record<
  Feature,
  { icon: React.FunctionComponent; title: string; subtitle: string }
> = {
  visualization: {
    icon: SchemaVisualizationIcon,
    title: 'Quick Visualization & Refactoring',
    subtitle: 'Instantly visualize and refactor data models',
  },
  collaboration: {
    icon: CollaborateIcon,
    title: 'Collaboration & Sharing with your team',
    subtitle: 'Collaborate and share schemas across teams',
  },
  interactive: {
    icon: FlexibilityIcon,
    title: 'Interactive Diagram Analysis',
    subtitle: 'Explore and annotate interactive diagrams',
  },
  insights: {
    icon: InsightIcon,
    title: 'Performance Insights & Optimization',
    subtitle: 'Uncover performance insights & best practices',
  },
};

const FeaturesList: React.FunctionComponent<{ features: Feature[] }> = ({
  features,
}) => {
  return (
    <div className={featuresListStyles}>
      {features.map((feature, key) => {
        const { icon: Icon, title, subtitle } = featureDescription[feature];
        return (
          <div key={key} className={featureItemStyles}>
            <Icon />
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};

export const SavedDiagramsList: React.FunctionComponent<{
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
              data-testid="saved-diagram-card"
              data-diagram-name={diagram.name}
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
        title="Design, Visualize, and Evolve your Data Model"
        subTitle={
          <>
            Your data model is the foundation of application performance. As
            applications evolve, so must your schema—intelligently and
            strategically. Minimize complexity, prevent performance bottlenecks,
            and keep your development agile.
            <FeaturesList
              features={[
                'visualization',
                'collaboration',
                'interactive',
                'insights',
              ]}
            />
            <Link href="https://www.mongodb.com/docs/compass/current/data-modeling/">
              Data Modeling Documentation
            </Link>
          </>
        }
        subTitleClassName={subTitleStyles}
        callToAction={
          <Button
            onClick={onCreateDiagramClick}
            variant="primary"
            data-testid="create-diagram-button"
          >
            Generate diagram
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
              Generate new diagram
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
