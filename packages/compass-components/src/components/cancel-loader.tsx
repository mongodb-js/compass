import React from 'react';
import { css, uiColors, spacing, SpinLoader, Subtitle, Button } from '..';

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
});

const textStyles = css({
  color: uiColors.green.dark2,
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
      <SpinLoader size="24px" />
      <Subtitle className={textStyles}>{progressText}</Subtitle>
      <Button variant="primaryOutline" onClick={onCancel}>
        {cancelText}
      </Button>
    </div>
  );
}

export default CancelLoader;
