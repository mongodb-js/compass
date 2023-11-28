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

const queryHoveredStylesDisabled = css({
  cursor: 'not-allowed',
});

export const QueryItemCard: React.FunctionComponent<{
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  header: (isHovered: boolean) => React.ReactNode;
  disabled?: boolean;
  ['data-testid']?: string;
}> = ({ children, onClick, header, disabled, 'data-testid': dataTestId }) => {
  const [hoverProps, isHovered] = useHoverState();
  let hoverStyles = queryHoveredStylesDisabled;

  if (isHovered && !disabled) {
    hoverStyles = queryHoveredStyles;
  }

  return (
    <KeylineCard
      onClick={onClick}
      data-testid={dataTestId}
      className={cx(queryStyles, hoverStyles)}
      {...hoverProps}
    >
      {header(isHovered)}
      {children}
    </KeylineCard>
  );
};
