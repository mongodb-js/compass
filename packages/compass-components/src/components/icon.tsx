import React from 'react';
import LeafyGreenIcon from '@leafygreen-ui/icon';

function Icon(
  props: React.ComponentProps<typeof LeafyGreenIcon>
): React.ReactElement {
  return <LeafyGreenIcon {...props} />;
}

export default Icon;
