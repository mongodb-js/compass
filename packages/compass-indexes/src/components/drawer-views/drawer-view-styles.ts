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

export const editorContainerStyles = css({
  borderRadius: spacing[300],
  border: `1px solid ${palette.gray.light2}`,
  background: palette.gray.light3,
  overflow: 'hidden',
});

export const editorContainerDarkModeStyles = css({
  border: `1px solid ${palette.gray.dark2}`,
  background: palette.gray.dark3,
});
