import { spacing, css } from '@mongodb-js/compass-components';
import React from 'react';

const formFieldContainerStyles = css({
  marginTop: spacing[3],
});

function FormFieldContainer({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <div className={formFieldContainerStyles}>{children}</div>;
}

export default FormFieldContainer;
