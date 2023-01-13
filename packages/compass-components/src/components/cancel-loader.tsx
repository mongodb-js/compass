import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';

import { Subtitle, Button } from './leafygreen';
import { SpinLoader } from './spin-loader';
import { useDarkMode } from '../hooks/use-theme';

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  maxWidth: spacing[6] * 8,
});

const textStyles = css({
  color: palette.green.dark2,
  textAlign: 'center',
});
const textDarkStyles = css({
  color: palette.green.light2,
});

function CancelLoader({
  ['data-testid']: dataTestId = 'cancel-loader',
  progressText,
  cancelText,
  onCancel,
}: {
  'data-testid'?: string;
  progressText: string;
  cancelText: string;
  onCancel: () => void;
}): React.ReactElement {
  const darkMode = useDarkMode();

  return (
    <div className={containerStyles} data-testid={dataTestId}>
      <SpinLoader size={`${spacing[4]}px`} />
      <Subtitle className={cx(textStyles, darkMode && textDarkStyles)}>
        {progressText}
      </Subtitle>
      <Button
        variant="primaryOutline"
        onClick={onCancel}
        data-testid={`${dataTestId}-button`}
      >
        {cancelText}
      </Button>
    </div>
  );
}

export default CancelLoader;
