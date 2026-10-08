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
  usePersistedState,
  useTranslation,
} from '@mongodb-js/compass-components';
import { useDataModelSavedItems } from '../provider';
import {
  deleteDiagram,
  openDiagram,
  openDiagramFromFile,
  showDiagramRenameModal,
} from '../store/diagram';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import CollaborateIcon from './icons/collaborate';
import SchemaVisualizationIcon from './icons/schema-visualization';
import FlexibilityIcon from './icons/flexibility';
import { CARD_HEIGHT, CARD_WIDTH, DiagramCard } from './diagram-card';
import { DiagramListToolbar } from './diagram-list-toolbar';
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
const featureIcons = {
  visualization: SchemaVisualizationIcon,
  collaboration: CollaborateIcon,
  interactive: FlexibilityIcon,
} as const satisfies Record<Feature, React.FunctionComponent>;

const FeaturesList: React.FunctionComponent<{ features: Feature[] }> = ({
  features,
}) => {
  const t = useTranslation();
  const featureTexts = {
    visualization: {
      title: t(
        'dataModeling.features.visualization.title',
        'Quick Visualization'
      ),
      subtitle: t(
        'dataModeling.features.visualization.subtitle',
        'Instantly visualize your data models'
      ),
    },
    collaboration: {
      title: t(
        'dataModeling.features.collaboration.title',
        'Collaboration & Sharing with your team'
      ),
      subtitle: t(
        'dataModeling.features.collaboration.subtitle',
        'Collaborate and share schemas across teams'
      ),
    },
    interactive: {
      title: t(
        'dataModeling.features.interactive.title',
        'Interactive Diagram Analysis'
      ),
      subtitle: t(
        'dataModeling.features.interactive.subtitle',
        'Explore and annotate interactive diagrams'
      ),
    },
  } as const satisfies Record<Feature, { title: string; subtitle: string }>;
  return (
    <div className={featuresListStyles}>
      {features.map((feature, key) => {
        const Icon = featureIcons[feature];
        const { title, subtitle } = featureTexts[feature];
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
  const t = useTranslation();
  return (
    <WorkspaceContainer>
      <EmptyContent
        title={t('dataModeling.empty.title', 'Visualize your Data Model')}
        subTitle={
          <>
            {t(
              'dataModeling.empty.description',
              'Your data model is the foundation of application performance. As applications evolve, so must your schema—intelligently and strategically. Minimize complexity, prevent performance bottlenecks, and keep your development agile.'
            )}
            <FeaturesList
              features={['visualization', 'collaboration', 'interactive']}
            />
            <Link href="https://www.mongodb.com/docs/compass/current/data-modeling/">
              {t('dataModeling.empty.docs', 'Data modeling documentation')}
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
              {t('dataModeling.empty.generate', 'Generate diagram')}
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
  const t = useTranslation();
  const { items, status } = useDataModelSavedItems();
  const sortByTranslated = useMemo(
    () => [
      { name: sortBy[0].name, label: t('dataModeling.list.sortName', 'Name') },
      {
        name: sortBy[1].name,
        label: t('dataModeling.list.sortLastModified', 'Last Modified'),
      },
    ],
    [t]
  );
  const [search, setSearch] = useState('');
  const filteredItems = useMemo(() => {
    try {
      const regex = new RegExp(search, 'i');
      return items.filter((x) => regex.test(x.name) || regex.test(x.database));
    } catch {
      return items;
    }
  }, [items, search]);

  const [initialSortState, setSortState] = usePersistedState<{
    name: (typeof sortBy)[number]['name'] | null;
    order: 1 | -1;
  }>('saved-diagrams-list-controls', { name: sortBy[0].name, order: 1 });
  const [sortControls, sortState] = useSortControls(sortByTranslated, {
    initialState: initialSortState,
    onChange: setSortState,
  });
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
              title={t('dataModeling.list.noResults', 'No results found.')}
              subTitle={t(
                'dataModeling.list.noResultsDescription',
                "We can't find any diagram matching your search."
              )}
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
  onDiagramRenameClick: showDiagramRenameModal,
  onImportDiagramClick: openDiagramFromFile,
})(SavedDiagramsList);
