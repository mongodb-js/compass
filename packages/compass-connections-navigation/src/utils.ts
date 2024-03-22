import { css, spacing } from '@mongodb-js/compass-components';

export const getItemLevelPaddingClass = (level: number) => {
  switch (level) {
    case 1:
      return css({
        paddingLeft: spacing[2],
      });
    case 2:
      return css({
        paddingLeft: spacing[5],
      });
    case 3:
      return css({
        paddingLeft: spacing[5] + spacing[5],
      });
  }
};
