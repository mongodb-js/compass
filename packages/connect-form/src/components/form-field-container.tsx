import React from 'react';

import { useUiKitContext } from '../contexts/ui-kit-context';

function FormFieldContainer({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  const { spacing, css, cx } = useUiKitContext();

  const formFieldContainerStyles = css({
    marginTop: spacing[3],
  });

  return (
    <div className={cx(formFieldContainerStyles, className)}>{children}</div>
  );
}

export default FormFieldContainer;
