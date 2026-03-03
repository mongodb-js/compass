import { css, palette, spacing } from '@mongodb-js/compass-components';

export const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export const contentStyles = css({
  padding: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  flexGrow: 1,
  overflowY: 'auto',
});

export const buttonContainerStyles = css({
  display: 'flex',
  gap: spacing[200],
  justifyContent: 'flex-end',
  padding: spacing[400],
});

export const editorContainerStyles = (darkMode?: boolean) =>
  css({
    borderRadius: spacing[300],
    border: `1px solid ${darkMode ? palette.gray.dark2 : palette.gray.light2}`,
    background: darkMode ? palette.gray.dark3 : palette.gray.light3,
    overflow: 'hidden',
  });
