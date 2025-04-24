import {
  Button,
  palette,
  Body,
  Code,
  Link,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import {
  CodemirrorInlineEditor,
  createQueryAutocompleter,
} from '@mongodb-js/compass-editor';

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

const QueryFlowSection = ({
  schemaFields,
  serverVersion,
}: {
  schemaFields: { name: string; description?: string }[];
  serverVersion: string;
}) => {
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

  const [inputQuery, setInputQuery] = React.useState('');
  const completer = useMemo(
    () =>
      createQueryAutocompleter({
        fields: schemaFields,
        serverVersion,
      }),
    [schemaFields, serverVersion]
  );

  return (
    <>
      <Body baseFontSize={16} weight="medium" className={headerStyles}>
        Input Query
      </Body>
      <div className={inputQueryContainerStyles}>
        <div>
          <CodemirrorInlineEditor
            data-testid="query-flow-section-code-editor"
            language="javascript-expression"
            text={inputQuery}
            onChangeText={(text) => setInputQuery(text)}
            placeholder="Type a query: { field: 'value' }"
            completer={completer}
          />
        </div>

        <div>
          <Button
            onClick={() => {
              // TODO in CLOUDP-311786
            }}
            className={suggestedIndexButtonStyles}
            size="small"
          >
            Show suggested index
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
