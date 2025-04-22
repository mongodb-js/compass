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
  border: `1px solid ${palette.gray.base}`,
  borderRadius: spacing[300],
  padding: spacing[600],
  display: 'flex',
  flexDirection: 'column',
});

const headerStyles = css({
  marginBottom: spacing[200],
});

const queryInputStyles = css({
  div: {
    border: 0,

    '&::hover': {
      border: 0,
    },
    '&::focus': {
      border: 0,
    },
  },
  input: {
    fontFamily: fontFamilies.code,
    '&::placeholder': {
      fontFamily: fontFamilies.code,
    },
  },
});

const suggestedIndexButtonStyles = css({
  float: 'right',
  marginTop: spacing[400],
});

const QueryFlowSection = () => {
  return (
    <>
      <Body baseFontSize={16} weight="medium" className={headerStyles}>
        Input Query
      </Body>
      <div className={inputQueryContainerStyles}>
        <div>
          <TextInput
            placeholder="Type a query: { field: 'value' }"
            aria-labelledby="query-text-area"
            className={queryInputStyles}
          />
        </div>
        <div>
          <Button
            onClick={() => {
              // TODO in CLOUDP-311786
            }}
            className={suggestedIndexButtonStyles}
          >
            Show me suggested index
          </Button>
        </div>
      </div>

      <div>
        <Body baseFontSize={16} weight="medium" className={headerStyles}>
          Suggested Index
        </Body>

        {/* Fill in actual data in CLOUDP-311786 */}
        <Code language="javascript">
          {`
db.getSiblingDB("sample_mflix").getCollection("comments").createIndex(
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
