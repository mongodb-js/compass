import { css, palette, spacing } from '@mongodb-js/compass-components';

export const containerStyles = css({
  padding: spacing[200],
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export const contentStyles = css({
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
  padding: spacing[600],
});

export const titleStyles = css({
  fontSize: '18px',
  fontWeight: 600,
  lineHeight: '24px',
});

export const descriptionStyles = css({
  fontSize: '13px',
  fontWeight: 400,
  lineHeight: '20px',
});

export const editorContainerStyles = css({
  borderRadius: spacing[300],
  border: `1px solid ${palette.gray.light2}`,
  background: palette.gray.light3,
  overflow: 'hidden',
});
