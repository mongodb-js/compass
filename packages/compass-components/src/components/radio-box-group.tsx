import React from 'react';

import { RadioBox as LeafyGreenRadioBox } from '@leafygreen-ui/radio-box-group';

export {
  RadioBoxGroup,
  Size as RadioBoxSize,
} from '@leafygreen-ui/radio-box-group';

export const RadioBox: React.FunctionComponent<
  Parameters<typeof LeafyGreenRadioBox>[0]
> = ({ children, ...props }) => {
  const dataTestId = (props as any)['data-testid'];
  delete (props as any)['data-testid'];

  return (
    <LeafyGreenRadioBox {...props}>
      <span data-testid={dataTestId}>{children}</span>
    </LeafyGreenRadioBox>
  );
};
