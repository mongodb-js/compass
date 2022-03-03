import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { RadioBoxGroup as LeafyGreenRadioBoxGroup } from './leafygreen';

const radioBoxGroupStyles = css({
  marginTop: spacing[1],
});

function RadioBoxGroup(
  props: React.ComponentProps<typeof LeafyGreenRadioBoxGroup>
): ReturnType<typeof LeafyGreenRadioBoxGroup> {
  return (
    <LeafyGreenRadioBoxGroup
      {...props}
      className={`${radioBoxGroupStyles}${
        props.className ? ` ${props.className}` : ''
      }`}
    />
  );
}

export { RadioBoxGroup };
