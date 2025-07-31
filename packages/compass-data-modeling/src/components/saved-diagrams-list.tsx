import React, { useMemo, useState } from 'react';
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
  Body,
} from '@mongodb-js/compass-components';
import { useDataModelSavedItems } from '../provider';
import {
  deleteDiagram,
  selectCurrentModel,
  openDiagram,
  openDiagramFromFile,
  renameDiagram,
} from '../store/diagram';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import CollaborateIcon from './icons/collaborate';
import SchemaVisualizationIcon from './icons/schema-visualization';
import FlexibilityIcon from './icons/flexibility';
import { CARD_HEIGHT, CARD_WIDTH, DiagramCard } from './diagram-card';
import { DiagramListToolbar } from './diagram-list-toolbar';
import toNS from 'mongodb-ns';
import { ImportDiagramButton } from './import-diagram-button';

const sortBy = [
  {
    name: 'name',
    label: 'Name',
  },
  {
    name: 'updatedAt',
    label: 'Last Modified',
  },
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
  onImportDiagram: (file: File) => void;
  onCreateDiagram: () => void;
  sortControls: React.ReactElement | null;
  searchTerm: string;
}>({
  onSearchDiagrams: () => {
    /** */
  },
  onImportDiagram: () => {
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

const diagramActionsStyles = css({
  display: 'flex',
  gap: spacing[200],
});

const featuresListStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: spacing[600],
  marginTop: spacing[400],
  marginBottom: spacing[400],
});

const featureItemTitleStyles = css({
  fontWeight: 'bold',
});

const featureItemStyles = css({
  display: 'grid',
  gridTemplateRows: `${spacing[1800]}px 1fr 1fr`,
  justifyItems: 'center',
  gap: spacing[400],
  width: spacing[1400] * 3,
});

type Feature = 'visualization' | 'collaboration' | 'interactive';
const featureDescription: Record<
  Feature,
  { icon: React.FunctionComponent; title: string; subtitle: string }
> = {
  visualization: {
    icon: SchemaVisualizationIcon,
    title: 'Quick Visualization',
    subtitle: 'Instantly visualize your data models',
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
            <Body className={featureItemTitleStyles}>{title}</Body>
            <Body>{subtitle}</Body>
          </div>
        );
      })}
    </div>
  );
};

const DiagramListEmptyContent: React.FunctionComponent<{
  onCreateDiagramClick: () => void;
  onImportDiagramClick: (file: File) => void;
}> = ({ onCreateDiagramClick, onImportDiagramClick }) => {
  return (
    <WorkspaceContainer>
      <EmptyContent
        title="Visualize your Data Model"
        subTitle={
          <>
            Your data model is the foundation of application performance. As
            applications evolve, so must your schema—intelligently and
            strategically. Minimize complexity, prevent performance bottlenecks,
            and keep your development agile.
            <FeaturesList
              features={['visualization', 'collaboration', 'interactive']}
            />
            <Link href="https://www.mongodb.com/docs/compass/current/data-modeling/">
              Data modeling documentation
            </Link>
          </>
        }
        subTitleClassName={subTitleStyles}
        callToAction={
          <div className={diagramActionsStyles}>
            <ImportDiagramButton onImportDiagram={onImportDiagramClick} />
            <Button
              onClick={onCreateDiagramClick}
              variant="primary"
              data-testid="create-diagram-button"
            >
              Generate diagram
            </Button>
          </div>
        }
      ></EmptyContent>
    </WorkspaceContainer>
  );
};

export const SavedDiagramsList: React.FunctionComponent<{
  onCreateDiagramClick: () => void;
  onOpenDiagramClick: (diagram: MongoDBDataModelDescription) => void;
  onDiagramDeleteClick: (id: string) => void;
  onDiagramRenameClick: (id: string) => void;
  onImportDiagramClick: (file: File) => void;
}> = ({
  onCreateDiagramClick,
  onOpenDiagramClick,
  onDiagramRenameClick,
  onDiagramDeleteClick,
  onImportDiagramClick,
}) => {
  const { items, status } = useDataModelSavedItems();
  const decoratedItems = useMemo<
    (MongoDBDataModelDescription & {
      databases: string;
    })[]
  >(() => {
    return items.map((item) => {
      const databases = new Set(
        selectCurrentModel(item.edits).collections.map(
          ({ ns }) => toNS(ns).database
        )
      );
      return {
        ...item,
        databases: Array.from(databases).join(', '),
      };
    });
  }, [items]);
  const [search, setSearch] = useState('');
  const filteredItems = useMemo(() => {
    try {
      const regex = new RegExp(search, 'i');
      return decoratedItems.filter(
        (x) => regex.test(x.name) || (x.databases && regex.test(x.databases))
      );
    } catch {
      return decoratedItems;
    }
  }, [decoratedItems, search]);
  const [sortControls, sortState] = useSortControls(sortBy);
  const sortedItems = useSortedItems(filteredItems, sortState);

  if (status === 'INITIAL' || status === 'LOADING') {
    return null;
  }
  if (items.length === 0) {
    return (
      <DiagramListEmptyContent
        onCreateDiagramClick={onCreateDiagramClick}
        onImportDiagramClick={onImportDiagramClick}
      />
    );
  }

  return (
    <DiagramListContext.Provider
      value={{
        sortControls,
        searchTerm: search,
        onCreateDiagram: onCreateDiagramClick,
        onSearchDiagrams: setSearch,
        onImportDiagram: onImportDiagramClick,
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
  onImportDiagramClick: openDiagramFromFile,
})(SavedDiagramsList);
