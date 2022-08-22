import { default as LeafyGreenTextInput } from '@leafygreen-ui/text-input';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import React from 'react';
import { withTheme } from '../hooks/use-theme';

// NOTE: we are wrapping this component to counter the 4px padding top
const textInputStyles = css({
  marginTop: -spacing[1],
});

function WrappedTextInput({
  ...props
}: React.ComponentProps<typeof LeafyGreenTextInput>): React.ReactElement {
  return (
    <LeafyGreenTextInput
      {...props}
      className={cx(textInputStyles, props.className)}
    />
  );
}

const TextInput = withTheme(WrappedTextInput);

export { TextInput };
