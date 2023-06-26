import React from 'react';

import {
  KeylineCard,
  css,
  cx,
  useHoverState,
  spacing,
  palette,
} from '@mongodb-js/compass-components';

const queryStyles = css({
  padding: spacing[3],
  marginTop: spacing[3],
});

const queryHoveredStyles = css({
  border: `1px solid ${palette.blue.base}`,
  cursor: 'pointer',
});

export const QueryItemCard: React.FunctionComponent<{
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  header: (isHovered: boolean) => React.ReactNode;
  ['data-testid']?: string;
}> = ({ children, onClick, header, 'data-testid': dataTestId }) => {
  const [hoverProps, isHovered] = useHoverState();
  return (
    <KeylineCard
      onClick={onClick}
      data-testid={dataTestId}
      className={cx(queryStyles, isHovered ? queryHoveredStyles : undefined)}
      {...hoverProps}
    >
      {header(isHovered)}
      {children}
    </KeylineCard>
  );
};
