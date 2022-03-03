import React from 'react';

import { Toggle as LeafyGreenToggle } from './leafygreen';
import { Theme, useTheme } from '../hooks/use-theme';

function Toggle(
  props: React.ComponentProps<typeof LeafyGreenToggle>
): ReturnType<typeof LeafyGreenToggle> {
  const theme = useTheme();

  return <LeafyGreenToggle darkMode={theme?.theme === Theme.Dark} {...props} />;
}

export { Toggle };
