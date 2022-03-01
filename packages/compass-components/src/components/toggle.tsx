import React from 'react';
import { Toggle as LeafyGreenToggle } from './leafygreen';

import { Theme, useTheme } from '../hooks/use-theme';
// import { withTheme } from '../hooks/use-theme';

// function Toggle(
//   props: React.ComponentProps<typeof LeafyGreenToggle>
// ): ReturnType<typeof LeafyGreenToggle> {
//   const theme = useTheme();

//   return <LeafyGreenToggle darkMode={theme?.theme === Theme.Dark} {...props} />;
// }

function Toggle(
  props: React.ComponentProps<typeof LeafyGreenToggle>
): ReturnType<typeof LeafyGreenToggle> {
  const theme = useTheme();

  return <LeafyGreenToggle darkMode={theme?.theme === Theme.Dark} {...props} />;
}

// LeafyGreenToggle
// const Toggle = withTheme<React.ComponentType<LeafyGreenToggle>>(LeafyGreenToggle);
// const Toggle = withTheme<typeof LeafyGreenToggle>(LeafyGreenToggle);
// const Toggle = withTheme<React.ComponentType<LeafyGreenToggle>>(LeafyGreenToggle);
// const Toggle = withTheme<typeof LeafyGreenToggle>(LeafyGreenToggle);
// const Toggle = withTheme<typeof LeafyGreenToggle>(LeafyGreenToggle);
// const toggle = withTheme<typeof LeafyGreenToggle>(LeafyGreenToggle as any);
// : React.ComponentType<typeof LeafyGreenToggle>
// const Toggle = withTheme(LeafyGreenToggle);

// function aa() {
//   return (
//     <Toggle
//       size="small"
//     />
//   )
// }

export { Toggle };
