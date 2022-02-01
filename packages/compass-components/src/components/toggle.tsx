import React from 'react';
import LeafyGreenToggle from '@leafygreen-ui/toggle';

import { useTheme } from '../hooks/use-theme';

function Toggle(
  props: React.ComponentProps<typeof LeafyGreenToggle>
): ReturnType<typeof LeafyGreenToggle> {
  const theme = useTheme();

  console.log('theme', theme?.theme);

  return <LeafyGreenToggle darkMode={theme?.theme === 'DARK'} {...props} />;
}

export { Toggle };
