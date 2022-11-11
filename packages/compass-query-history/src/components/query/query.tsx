import React from 'react';

import {
  KeylineCard,
  Body,
  Code,
  css,
  cx,
  useHoverState,
  spacing,
  palette,
} from '@mongodb-js/compass-components';
import { formatQuery } from '../../utils';

export type QueryAttributes = Record<string, any>;

const queryHeadingStyles = css({
  display: 'flex',
});

const queryHeadingTextStyles = css({
  fontSize: '16px',
  lineHeight: `${spacing[5]}px`, // line up with hover icons
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flexGrow: 1,
});

const QueryHeading: React.FunctionComponent<{
  title: string;
}> = ({ title, children }) => {
  return (
    <div className={queryHeadingStyles}>
      <Body
        className={queryHeadingTextStyles}
        data-testid="query-history-query-title"
      >
        {title}
      </Body>
      {children}
    </div>
  );
};

const queryLabelStyles = css({
  textTransform: 'capitalize',
  fontWeight: 'bold',
  margin: `${spacing[2]}px 0`,
});

const queryCodeStyles = css({
  maxHeight: '30vh',
});

const QueryAttributes: React.FunctionComponent<{
  attributes: QueryAttributes;
}> = ({ attributes }) => {
  return (
    <div data-testid="query-history-query-attributes">
      {Object.entries(attributes).map(([key, value], index) => (
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

const queryStyles = css({
  padding: spacing[3],
  marginTop: spacing[3],
});

const queryHoveredStyles = css({
  border: `1px solid ${palette.blue.base}`,
  cursor: 'pointer',
});

const childrenStyles = css({
  display: 'none',
  whiteSpace: 'nowrap',
});

const childrenHoveredStyles = css({
  display: 'block',
});

export const Query: React.FunctionComponent<{
  title: string;
  attributes: QueryAttributes;
  runQuery: () => void;
  ['data-testid']?: string;
  customHeading?: JSX.Element;
}> = ({ title, attributes, runQuery, customHeading, children, ...props }) => {
  const [hoverProps, isHovered] = useHoverState();

  return (
    <KeylineCard
      onClick={runQuery}
      data-testid={props['data-testid']}
      className={cx(queryStyles, isHovered ? queryHoveredStyles : undefined)}
      {...hoverProps}
    >
      {customHeading ? (
        customHeading
      ) : (
        <QueryHeading title={title}>
          <div
            data-testid="query-history-query-hoveritems"
            className={cx(
              childrenStyles,
              isHovered ? childrenHoveredStyles : undefined
            )}
          >
            {children}
          </div>
        </QueryHeading>
      )}
      <QueryAttributes attributes={attributes} />
    </KeylineCard>
  );
};
