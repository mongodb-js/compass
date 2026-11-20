import { themeQuartz } from 'ag-grid-community';
import { fontFamilies } from '@mongodb-js/compass-components';

// Colors reference the --compass-ag-grid-* custom properties declared in
// document-table-view.less so that the dark mode container class keeps
// switching the palette without re-creating the theme.
export const gridTheme = themeQuartz.withParams({
  fontFamily: fontFamilies.code,
  fontSize: 12,
  headerFontSize: 12,
  headerFontWeight: 'bold',
  headerHeight: 25,
  rowHeight: 28,
  cellHorizontalPadding: 5,
  wrapperBorderRadius: 3,
  wrapperBorder: false,
  foregroundColor: 'currentColor',
  backgroundColor: 'var(--compass-ag-grid-background)',
  headerBackgroundColor: 'var(--compass-ag-grid-header-background)',
  headerCellHoverBackgroundColor:
    'var(--compass-ag-grid-header-background-hover)',
  rowHoverColor: 'var(--compass-ag-grid-background-hover)',
  borderColor: 'var(--compass-ag-grid-border)',
  columnBorder: true,
});
