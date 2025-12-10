import React from 'react';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import { useDarkMode } from '../hooks/use-theme';
import { Subtitle, Button, ProgressBar } from './leafygreen';
import type { ProgressBarProps } from '@leafygreen-ui/progress-bar';

const loaderContainerStyles = css({
  display: 'flex',
  gap: spacing[200],
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  maxWidth: spacing[1600] * 8,
});

const progressContainerStyles = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  maxWidth: spacing[1600] * 8,
  gap: spacing[500],
  margin: '0 auto',
});

const textStyles = css({
  color: palette.green.dark2,
  textAlign: 'center',
});

const textDarkStyles = css({
  color: palette.green.light2,
});

type SpinLoaderProps = {
  size?: string | number;
  title?: string;
  darkMode?: boolean;
};

type SpinLoaderWithLabelProps = Omit<SpinLoaderProps, 'size' | 'title'> & {
  progressText: string;
  className?: string;
  children?: React.ReactNode;
  ['data-testid']?: string;
};

type CancelActionProps = {
  onCancel(): void;
  cancelText?: string;
};

type CancelLoaderProps = Omit<SpinLoaderWithLabelProps, 'children'> &
  CancelActionProps;

type ProgressLoaderWithCancelProps = CancelActionProps & ProgressBarProps;

const shellLoaderSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const spinLoaderStyle = css`
  border: 2px solid transparent;
  border-radius: 50%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: inline-block;

  animation: ${shellLoaderSpin} 700ms ease infinite;
`;
const lightStyles = css({
  borderTop: `2px solid ${palette.gray.dark3}`,
});

const darkStyles = css({
  borderTop: `2px solid ${palette.gray.light3}`,
});

function SpinLoader({
  size = 12,
  title,
  darkMode: _darkMode,
}: SpinLoaderProps) {
  const darkMode = useDarkMode(_darkMode);

  return (
    <div
      className={cx(spinLoaderStyle, darkMode ? darkStyles : lightStyles)}
      style={{
        width: size,
        height: size,
      }}
      title={title}
    />
  );
}

function SpinLoaderWithLabel({
  className,
  progressText,
  ['data-testid']: dataTestId,
  children,
  darkMode: _darkMode,
  ...props
}: SpinLoaderWithLabelProps): JSX.Element {
  const darkMode = useDarkMode(_darkMode);

  return (
    <div
      className={cx(loaderContainerStyles, className)}
      data-testid={dataTestId}
    >
      <SpinLoader
        size={spacing[600]}
        darkMode={darkMode}
        {...props}
      ></SpinLoader>
      <Subtitle className={cx(textStyles, darkMode && textDarkStyles)}>
        {progressText}
      </Subtitle>
      {children}
    </div>
  );
}

function CancelLoader({
  cancelText = 'Cancel',
  onCancel,
  ...props
}: CancelLoaderProps): React.ReactElement {
  return (
    <SpinLoaderWithLabel {...props}>
      <Button
        variant="primaryOutline"
        onClick={onCancel}
        data-testid={`${props['data-testid'] ?? 'spin-loader'}-button`}
      >
        {cancelText}
      </Button>
    </SpinLoaderWithLabel>
  );
}

function ProgressLoaderWithCancel({
  cancelText = 'Cancel',
  className,
  onCancel,
  ...props
}: ProgressLoaderWithCancelProps): React.ReactElement {
  return (
    <div className={cx(progressContainerStyles, className)}>
      <ProgressBar {...props} />
      <Button
        variant="primaryOutline"
        onClick={onCancel}
        data-testid={`${props['data-testid'] ?? 'spin-loader'}-button`}
      >
        {cancelText}
      </Button>
    </div>
  );
}

export {
  SpinLoaderWithLabel,
  SpinLoader,
  CancelLoader,
  ProgressLoaderWithCancel,
};
