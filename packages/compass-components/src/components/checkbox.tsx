import React from 'react';

import { Checkbox as LeafyGreenCheckbox } from './leafygreen';
import { Theme, useTheme } from '../hooks/use-theme';

function Checkbox(
  props: React.ComponentProps<typeof LeafyGreenCheckbox>
): ReturnType<typeof LeafyGreenCheckbox> {
  const theme = useTheme();

  return (
    <LeafyGreenCheckbox darkMode={theme?.theme === Theme.Dark} {...props} />
  );
}

export { Checkbox };
