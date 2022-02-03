import React from 'react';
import LeafyGreenToggle from '@leafygreen-ui/toggle';

import { Theme, useTheme } from '../hooks/use-theme';

function Toggle(
  props: React.ComponentProps<typeof LeafyGreenToggle>
): ReturnType<typeof LeafyGreenToggle> {
  const theme = useTheme();

  return <LeafyGreenToggle darkMode={theme?.theme === Theme.Dark} {...props} />;
}

export { Toggle };
