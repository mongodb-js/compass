import React from 'react';
import { Body, Code, css, spacing } from '@mongodb-js/compass-components';
import { formatQuery } from '../../../utils';
import { type BaseQuery } from '../../../constants/query-properties';

const queryLabelStyles = css({
  textTransform: 'capitalize',
  fontWeight: 'bold',
  margin: `${spacing[2]}px 0`,
});

const queryCodeStyles = css({
  maxHeight: '30vh',
});

export const QueryItemContent: React.FunctionComponent<{
  query: BaseQuery;
}> = ({ query }) => {
  return (
    <div data-testid="query-history-query-attributes">
      {Object.entries(query).map(([key, value], index) => (
        <div key={index} data-testid="query-history-query-attribute">
          <Body
            data-testid="query-history-query-label"
            className={queryLabelStyles}
          >
            {key}
          </Body>
          <Code
            className={queryCodeStyles}
            data-testid="query-history-query-code"
            language="javascript"
            copyable={false}
          >
            {formatQuery(value)}
          </Code>
        </div>
      ))}
    </div>
  );
};
