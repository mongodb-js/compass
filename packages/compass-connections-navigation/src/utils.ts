import { css, spacing } from '@mongodb-js/compass-components';

export const getItemPaddingClass = ({
  level,
  isPlaceholder,
  isLegacy,
}: {
  level: number;
  isPlaceholder?: boolean;
  isLegacy?: boolean;
}) => {
  let paddingLeft = 0;
  switch (level) {
    case 1:
      if (isLegacy) {
        paddingLeft = spacing[2];
      }
      break;
    case 2:
      paddingLeft = spacing[3];
      if (isLegacy) {
        paddingLeft = spacing[6];
      }
      break;
    case 3:
      paddingLeft = spacing[3] + spacing[5];
      break;
  }

  if (isPlaceholder && (level === 1 || (!isLegacy && level === 2))) {
    paddingLeft += spacing[1];
  }

  return css({ paddingLeft });
};
