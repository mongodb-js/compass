import React from 'react';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import { useDarkMode } from '../hooks/use-theme';
import { Subtitle, Button } from './leafygreen';

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

type LoaderProps = {
  size?: string | number;
  title?: string;
  darkMode?: boolean;
};

type LoaderWithLabelProps = Omit<LoaderProps, 'size' | 'title'> & {
  progressText: string;
  className?: string;
  children?: React.ReactNode;
  ['data-testid']?: string;
};

type CancelLoaderProps = Omit<LoaderWithLabelProps, 'children'> & {
  onCancel(): void;
  cancelText: string;
};

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

function Loader({ size = 12, title, darkMode: _darkMode }: LoaderProps) {
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

function LoaderWithLabel({
  className,
  progressText,
  ['data-testid']: dataTestId,
  children,
  darkMode: _darkMode,
  ...props
}: LoaderWithLabelProps): JSX.Element {
  const darkMode = useDarkMode(_darkMode);

  return (
    <div className={cx(containerStyles, className)} data-testid={dataTestId}>
      <Loader size={spacing[4]} darkMode={darkMode} {...props}></Loader>
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
    <LoaderWithLabel {...props}>
      <Button
        variant="primaryOutline"
        onClick={onCancel}
        data-testid={`${props['data-testid'] ?? 'spin-loader'}-button`}
      >
        {cancelText}
      </Button>
    </LoaderWithLabel>
  );
}

export { LoaderWithLabel, Loader, CancelLoader };
