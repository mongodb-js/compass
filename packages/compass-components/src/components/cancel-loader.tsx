import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';

import { Subtitle, Button } from './leafygreen';
import { SpinLoader } from './spin-loader';

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  maxWidth: spacing[6] * 8,
});

const textStyles = css({
  color: uiColors.green.dark2,
  textAlign: 'center',
});

function CancelLoader({
  dataTestId,
  progressText,
  cancelText,
  onCancel,
}: {
  dataTestId: string;
  progressText: string;
  cancelText: string;
  onCancel: () => void;
}): React.ReactElement {
  return (
    <div className={containerStyles} data-testid={dataTestId}>
      <SpinLoader size={`${spacing[4]}px`} />
      <Subtitle className={textStyles}>{progressText}</Subtitle>
      <Button variant="primaryOutline" onClick={onCancel}>
        {cancelText}
      </Button>
    </div>
  );
}

export default CancelLoader;
