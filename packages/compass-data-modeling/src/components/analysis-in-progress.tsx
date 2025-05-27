import React from 'react';
import {
  Body,
  css,
  Subtitle,
  palette,
  cx,
  useDarkMode,
  Button,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { cancelAnalysis } from '../store/analysis-process';

const containerStyles = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});
const contentStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  width: 600,
});

const titleAndProgressStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: 8,
  justifyContent: 'space-between',
  alignItems: 'center',
});

const titleStyles = css({
  color: palette.green.dark2,
  textAlign: 'center',
});

const titleDarkStyles = css({
  color: palette.green.light2,
});

const actionContainerStyles = css({
  display: 'flex',
  justifyContent: 'center',
  marginTop: 32,
});

const progressBarStyles = css({
  background: palette.gray.light1,
  borderRadius: spacing[100],
  height: spacing[200],
  width: '100%',
});

const activeProgressBarStyles = css({
  backgroundImage: `linear-gradient(90deg, ${palette.blue.light1}, ${palette.blue.dark1}, ${palette.blue.light1})`,
  backgroundSize: '200% 100%',
  borderRadius: 4,
  height: '100%',
  content: '""',
  display: 'block',
  animation: 'animateBar 1s ease-in infinite',
  '@keyframes animateBar': {
    '0%': {
      backgroundPosition: '0 50%',
    },
    '50%': {
      backgroundPosition: '100% 50%',
    },
    '100%': {
      backgroundPosition: '0 50%',
    },
  },
});

type AnalysisInProgressProps = {
  progress: number;
  description: string;
  onCancel: () => void;
};

const AnalysisInProgress = ({
  progress,
  description,
  onCancel,
}: AnalysisInProgressProps) => {
  const darkMode = useDarkMode();
  return (
    <div className={containerStyles}>
      <div className={contentStyles}>
        <div className={titleAndProgressStyles}>
          <Subtitle className={cx(titleStyles, darkMode && titleDarkStyles)}>
            Analyzing Documents ...
          </Subtitle>
          <Body>{progress}%</Body>
        </div>
        <div>
          <div className={progressBarStyles}>
            <div
              className={cx(activeProgressBarStyles)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Body>{description}</Body>
        <div className={actionContainerStyles}>
          <Button onClick={onCancel} variant="primaryOutline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default connect(
  ({
    step,
    analysisProgress: { currentAnalysisOptions, schemasAnalyzed },
  }: DataModelingState) => {
    if (!currentAnalysisOptions || step !== 'ANALYZING') {
      throw new Error('Unexpected state when analyzing collections');
    }
    const progress = currentAnalysisOptions
      ? (schemasAnalyzed / currentAnalysisOptions.collections.length) * 100
      : 0;
    const description = `Analyzing ${schemasAnalyzed + 1} of ${
      currentAnalysisOptions.collections.length
    } collections`;
    return {
      progress: Math.round(progress),
      description,
    };
  },
  {
    onCancel: cancelAnalysis,
  }
)(AnalysisInProgress);
