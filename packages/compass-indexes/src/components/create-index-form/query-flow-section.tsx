import { Button, palette, TextInput } from '@mongodb-js/compass-components';
import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';

const queryInputStyles = css({
  borderColor: palette.gray.base,
  textinput: {
    padding: spacing[600],
    fontFamily: 'Source Code Pro',
    '&::placeholder': {
      fontFamily: 'Source Code Pro',
    },
  },
});

const QueryFlowSection = () => {
  return (
    <>
      <TextInput
        placeholder="Type a query: { field: 'value' }"
        aria-labelledby="query-text-area"
        className={queryInputStyles}
      />
      <Button>Show me suggested index</Button>
    </>
  );
};

export default QueryFlowSection;
