import { spacing } from '@mongodb-js/compass-components';

export const getItemPaddingStyles = ({
  level,
  isPlaceholder,
  isSingleConnection,
}: {
  level: number;
  isPlaceholder?: boolean;
  isSingleConnection?: boolean;
}) => {
  let paddingLeft = 0;
  if (isSingleConnection) {
    /** SC version */
    switch (level) {
      case 1:
        paddingLeft = spacing[2];
        break;
      case 2:
        paddingLeft = spacing[6];
        break;
    }

    if (isPlaceholder && level === 1) {
      paddingLeft += spacing[2];
    }
  } else {
    /** MC version */
    switch (level) {
      case 2:
        paddingLeft = spacing[3] + spacing[1] + spacing[50];
        break;
      case 3:
        paddingLeft = spacing[6] + spacing[2];
        break;
    }

    if (isPlaceholder && (level === 1 || level === 2)) {
      paddingLeft += spacing[2];
    }
  }

  return { paddingLeft };
};
