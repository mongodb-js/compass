import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import React from 'react';

const formFieldContainerStyles = css({
  margin: `${spacing[4]}px 0`,
});

function FormFieldContainer({
  className = '',
  children,
  ...props
}: {
  ['data-testid']?: string;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={cx(formFieldContainerStyles, className)}
      data-testid={props['data-testid']}
    >
      {children}
    </div>
  );
}

export default FormFieldContainer;
