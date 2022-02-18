import React from 'react';
import LeafygreenToggle from '@leafygreen-ui/toggle';

import { Theme, useTheme } from '../hooks/use-theme';

function Toggle(
  props: React.ComponentProps<typeof LeafygreenToggle>
): ReturnType<typeof LeafygreenToggle> {
  const theme = useTheme();

  return <LeafygreenToggle darkMode={theme?.theme === Theme.Dark} {...props} />;
}

export { Toggle };
