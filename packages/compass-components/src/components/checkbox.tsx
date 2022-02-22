import React from 'react';
import LeafyGreenCheckbox from '@leafygreen-ui/checkbox';
import { css } from '@leafygreen-ui/emotion';

import { Theme, useTheme } from '../hooks/use-theme';

const checkboxOverrideStyles = css({
  fontWeight: 'bold',
});

function Checkbox(
  props: React.ComponentProps<typeof LeafyGreenCheckbox>
): ReturnType<typeof LeafyGreenCheckbox> {
  const theme = useTheme();

  return (
    <LeafyGreenCheckbox
      className={checkboxOverrideStyles}
      darkMode={theme?.theme === Theme.Dark}
      {...props}
    />
  );
}

export { Checkbox };
