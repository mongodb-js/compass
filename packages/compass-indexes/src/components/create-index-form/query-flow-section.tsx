import {
  Button,
  palette,
  TextInput,
  Body,
  fontFamilies,
  Code,
  Link,
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
  },
  input: {
    fontFamily: `${fontFamilies.code} !important`,
    '&::placeholder': {
      fontFamily: fontFamilies.code,
    },
  },
});

const suggestedIndexContainerStyles = css({
  flexDirection: 'column',
  display: 'flex',
});

const suggestedIndexButtonStyles = css({
  float: 'right',
  marginTop: spacing[400],
});

const programmingLanguageLinkStyles = css({
  marginLeft: 'auto',
  marginTop: spacing[100],
});

const QueryFlowSection = () => {
  // TODO in CLOUDP-311786, replace hardcoded values with actual data
  const db_name = 'sample_mflix';
  const collection_name = 'comments';

  const formatSuggestedIndex = () => {
    return `
db.getSiblingDB("${db_name}").getCollection("${collection_name}").createIndex(
  "awards.win": "1",
  "imdb.rating": "1",
});
`;
  };

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
      <Body baseFontSize={16} weight="medium" className={headerStyles}>
        Suggested Index
      </Body>{' '}
      <div className={suggestedIndexContainerStyles}>
        <Code
          data-testid="query-flow-section-suggested-index"
          language="javascript"
        >
          {formatSuggestedIndex()}
        </Code>
        <span className={programmingLanguageLinkStyles}>
          View programming language driver syntax{' '}
          <Link
            href="https://www.mongodb.com/docs/manual/core/indexes/create-index/"
            target="_blank"
            rel="noreferrer noopener"
          >
            here
          </Link>
          .
        </span>
      </div>
    </>
  );
};

export default QueryFlowSection;
