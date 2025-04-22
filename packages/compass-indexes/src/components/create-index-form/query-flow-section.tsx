import {
  Button,
  palette,
  TextInput,
  Body,
  fontFamilies,
  Code,
} from '@mongodb-js/compass-components';
import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';

const inputQueryContainerStyles = css({
  marginBottom: spacing[600],
});

const headerStyles = css({
  marginBottom: spacing[200],
});

const queryInputStyles = css({
  borderColor: palette.gray.base,
  input: {
    padding: spacing[600],
    fontFamily: fontFamilies.code,
    '&::placeholder': {
      fontFamily: fontFamilies.code,
    },
  },
});

const QueryFlowSection = () => {
  return (
    <>
      <div className={inputQueryContainerStyles}>
        <Body baseFontSize={16} weight="medium" className={headerStyles}>
          Input Query
        </Body>
        <TextInput
          placeholder="Type a query: { field: 'value' }"
          aria-labelledby="query-text-area"
          className={queryInputStyles}
        />
        <Button>Show me suggested index</Button>
      </div>

      <div>
        <Body baseFontSize={16} weight="medium" className={headerStyles}>
          Suggested Index
        </Body>
        <Code language="javascript">
          {`
sample_mflix.comments.createIndex({
  "awards.win": "1",
  "imdb.rating": "1",
})
`}
        </Code>
      </div>
    </>
  );
};

export default QueryFlowSection;
