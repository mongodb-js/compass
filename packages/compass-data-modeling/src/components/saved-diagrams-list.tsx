import React, { useCallback, useState } from 'react';
import { connect } from 'react-redux';
import { createNewDiagram } from '../store/generate-diagram-wizard';
import {
  Button,
  css,
  EmptyContent,
  Icon,
  spacing,
  useSortControls,
  useSortedItems,
  VirtualGrid,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import { useDataModelSavedItems } from '../provider';
import { deleteDiagram, openDiagram, renameDiagram } from '../store/diagram';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
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

const contentStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  width: '100%',
  height: '100%',
});

const rowStyles = css({
  gap: spacing[200],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  paddingBottom: spacing[200],
});

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

  const [filteredItems, setFilteredItems] = useState(items);
  const [sortControls, sortState] = useSortControls(sortBy);
  const sortedItems = useSortedItems(filteredItems, sortState);

  const onFilterItems = useCallback(
    (search: string) => {
      try {
        const regex = new RegExp(search, 'i');
        // TODO: Currently only searching for name. Add more fields
        setFilteredItems(items.filter((x) => regex.test(x.name)));
      } catch {
        setFilteredItems(items);
      }
    },
    [items]
  );

  if (status === 'INITIAL' || status === 'LOADING') {
    return null;
  }

  const showList = items.length > 0;

  let content;

  if (showList) {
    content = (
      <VirtualGrid
        data-testid="data-modeling-diagrams-list"
        itemMinWidth={CARD_WIDTH}
        itemHeight={CARD_HEIGHT + spacing[200]}
        itemsCount={sortedItems.length}
        renderItem={({ index }) => (
          <DiagramCard
            diagram={sortedItems[index]}
            onOpen={onOpenDiagramClick}
            onRename={onDiagramRenameClick}
            onDelete={onDiagramDeleteClick}
          />
        )}
        itemKey={(index: number) => sortedItems[index].id}
        renderHeader={() => (
          <DiagramListToolbar
            onCreateDiagramClick={onCreateDiagramClick}
            onFilter={onFilterItems}
            sortControls={sortControls}
          />
        )}
        headerHeight={spacing[800] + 36}
        // renderEmptyList={NoSearchResults}
        classNames={{ row: rowStyles }}
        resetActiveItemOnBlur={false}
      ></VirtualGrid>
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

  return <WorkspaceContainer>{content}</WorkspaceContainer>;
};

export default connect(null, {
  onCreateDiagramClick: createNewDiagram,
  onOpenDiagramClick: openDiagram,
  onDiagramDeleteClick: deleteDiagram,
  onDiagramRenameClick: renameDiagram,
})(SavedDiagramsList);
