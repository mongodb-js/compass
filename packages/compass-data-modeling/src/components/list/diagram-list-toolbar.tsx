import React, { useContext } from 'react';
import {
  Button,
  css,
  cx,
  Icon,
  palette,
  SearchInput,
  spacing,
  Subtitle,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { DiagramListContext } from './saved-diagrams-list';
import { ImportDiagramButton } from './import-diagram-button';

const containerStyles = css({
  padding: spacing[400],
  display: 'grid',
  gridTemplateAreas: `
    'title createDiagram'
    'searchInput sortControls'
  `,
  columnGap: spacing[800],
  rowGap: spacing[200],
  gridTemplateColumns: '5fr',
});

const titleStyles = css({
  gridArea: 'title',
});
const diagramActionsStyles = css({
  gridArea: 'createDiagram',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[200],
});
const searchInputStyles = css({
  gridArea: 'searchInput',
});
const sortControlsStyles = css({
  gridArea: 'sortControls',
  display: 'flex',
  justifyContent: 'flex-end',
});

const toolbarTitleLightStyles = css({ color: palette.gray.dark1 });
const toolbarTitleDarkStyles = css({ color: palette.gray.light1 });

export const DiagramListToolbar = () => {
  const {
    onSearchDiagrams: onSearch,
    onCreateDiagram,
    sortControls,
    searchTerm,
    onImportDiagram,
  } = useContext(DiagramListContext);
  const darkMode = useDarkMode();

  return (
    <div className={containerStyles}>
      <Subtitle
        className={cx(
          titleStyles,
          darkMode ? toolbarTitleDarkStyles : toolbarTitleLightStyles
        )}
      >
        Open an existing diagram:
      </Subtitle>
      <div className={diagramActionsStyles}>
        <ImportDiagramButton
          leftGlyph={<Icon glyph="Import" />}
          size="small"
          onImportDiagram={onImportDiagram}
        />
        <Button
          onClick={onCreateDiagram}
          variant="primary"
          size="small"
          data-testid="create-diagram-button"
          leftGlyph={<Icon glyph="Plus"></Icon>}
        >
          Generate new diagram
        </Button>
      </div>
      <SearchInput
        aria-label="Search diagrams"
        value={searchTerm}
        className={searchInputStyles}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className={sortControlsStyles}>{sortControls}</div>
    </div>
  );
};
