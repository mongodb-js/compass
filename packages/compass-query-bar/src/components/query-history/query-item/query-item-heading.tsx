import { Body, cx, css, spacing } from '@mongodb-js/compass-components';
import React from 'react';

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

const childrenStyles = css({
  display: 'none',
  whiteSpace: 'nowrap',
});

const childrenHoveredStyles = css({
  display: 'block',
});

export const QueryItemHeading: React.FunctionComponent<{
  title: string;
  isHovered: boolean;
}> = ({ title, isHovered, children }) => {
  return (
    <div
      data-testid="query-history-query-hoveritems"
      className={queryHeadingStyles}
    >
      <Body
        className={queryHeadingTextStyles}
        data-testid="query-history-query-title"
      >
        {title}
      </Body>
      <div
        className={cx(
          childrenStyles,
          isHovered ? childrenHoveredStyles : undefined
        )}
      >
        {children}
      </div>
    </div>
  );
};
