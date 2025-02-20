import { css, spacing } from '@mongodb-js/compass-components';

export const bannerStyles = css({
  textAlign: 'justify',
});

export const paragraphStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

export const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  marginBottom: spacing[400],
  textAlign: 'justify',
});

export const bannerBtnStyles = css({
  float: 'right',
  height: `${spacing[600]}px`,
});
