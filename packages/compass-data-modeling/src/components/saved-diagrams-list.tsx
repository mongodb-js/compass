import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { createNewDiagram } from '../store/generate-diagram-wizard';
import {
  Button,
  css,
  EmptyContent,
  spacing,
  useSortControls,
  useSortedItems,
  VirtualGrid,
  Link,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import { useDataModelSavedItems } from '../provider';
import { deleteDiagram, openDiagram, renameDiagram } from '../store/diagram';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import CollaborateIcon from './icons/collaborate';
import SchemaVisualizationIcon from './icons/schema-visualization';
import FlexibilityIcon from './icons/flexibility';
import InsightIcon from './icons/insight';
import { CARD_HEIGHT, CARD_WIDTH, DiagramCard } from './diagram-card';
import { DiagramListToolbar } from './diagram-list-toolbar';

const sortBy = [
  {
    name: 'name',
    label: 'Name',
  },
  // TODO: Currently we do not have lastModified.
  // {
  //   name: 'lastModified',
  //   label: 'Last Modified',
  // },
] as const;

const listContainerStyles = css({ height: '100%' });
const rowStyles = css({
  gap: spacing[200],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  paddingBottom: spacing[200],
});

export const DiagramListContext = React.createContext<{
  onSearchDiagrams: (search: string) => void;
  onCreateDiagram: () => void;
  sortControls: React.ReactElement | null;
  searchTerm: string;
}>({
  onSearchDiagrams: () => {
    /** */
  },
  onCreateDiagram: () => {
    /** */
  },
  sortControls: null,
  searchTerm: '',
});

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
  const [search, setSearch] = useState('');
  const filteredItems = useMemo(() => {
    try {
      const regex = new RegExp(search, 'i');
      // Currently only searching for name. We may want to add more fields
      // to search for in the future.
      return items.filter((x) => regex.test(x.name));
    } catch {
      return items;
    }
  }, [items, search]);
  const [sortControls, sortState] = useSortControls(sortBy);
  const sortedItems = useSortedItems(filteredItems, sortState);

  if (status === 'INITIAL' || status === 'LOADING') {
    return null;
  }

  if (items.length === 0) {
    return (
      <WorkspaceContainer>
        <EmptyContent
          title="Design, Visualize, and Evolve your Data Model"
          subTitle={
            <>
              Your data model is the foundation of application performance. As
              applications evolve, so must your schema—intelligently and
              strategically. Minimize complexity, prevent performance
              bottlenecks, and keep your development agile.
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
      </WorkspaceContainer>
    );
  }

  return (
    <DiagramListContext.Provider
      value={{
        sortControls,
        searchTerm: search,
        onCreateDiagram: onCreateDiagramClick,
        onSearchDiagrams: setSearch,
      }}
    >
      <WorkspaceContainer>
        <VirtualGrid
          data-testid="saved-diagram-list"
          itemMinWidth={CARD_WIDTH}
          itemHeight={CARD_HEIGHT + spacing[200]}
          itemsCount={sortedItems.length}
          className={listContainerStyles}
          renderItem={({ index }) => (
            <DiagramCard
              diagram={sortedItems[index]}
              onOpen={onOpenDiagramClick}
              onRename={onDiagramRenameClick}
              onDelete={onDiagramDeleteClick}
            />
          )}
          itemKey={(index) => sortedItems[index].id}
          renderHeader={DiagramListToolbar}
          headerHeight={spacing[800] * 3 + spacing[200]}
          classNames={{ row: rowStyles }}
          resetActiveItemOnBlur={false}
          renderEmptyList={() => (
            <EmptyContent
              title="No results found."
              subTitle="We can't find any diagram matching your search."
            />
          )}
        ></VirtualGrid>
      </WorkspaceContainer>
    </DiagramListContext.Provider>
  );
};

export default connect(null, {
  onCreateDiagramClick: createNewDiagram,
  onOpenDiagramClick: openDiagram,
  onDiagramDeleteClick: deleteDiagram,
  onDiagramRenameClick: renameDiagram,
})(SavedDiagramsList);
