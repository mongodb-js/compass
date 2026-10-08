import {
  ProgressLoaderWithCancel,
  useDarkMode,
  useTranslation,
} from '@mongodb-js/compass-components';
import React from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { cancelAnalysis, type AnalysisStep } from '../store/analysis-process';

function getProgressPropsFromStatus(
  t: ReturnType<typeof useTranslation>,
  {
    step,
    sampledCollections,
    analyzedCollections,
    collectionRelationsInferred,
    totalCollections,
  }: {
    step: AnalysisStep;
    sampledCollections: number;
    analyzedCollections: number;
    collectionRelationsInferred: number;
    totalCollections: number;
  }
): {
  label: string;
} & (
  | {
      isIndeterminate: false;
      maxValue: number;
      value: number;
      formatValue?: 'fraction';
    }
  | {
      isIndeterminate: true;
    }
) {
  if (step === 'SAMPLING') {
    return {
      isIndeterminate: false,
      label: t('dataModeling.analysis.sampling', 'Sampling collections…'),
      maxValue: totalCollections,
      value: sampledCollections,
      formatValue: 'fraction',
    };
  }
  if (step === 'ANALYZING_SCHEMA') {
    return {
      isIndeterminate: false,
      label: t(
        'dataModeling.analysis.analyzing',
        'Analyzing collection schemas…'
      ),
      maxValue: totalCollections,
      value: analyzedCollections,
      formatValue: 'fraction',
    };
  }
  if (step === 'INFERRING_RELATIONSHIPS') {
    return {
      isIndeterminate: false,
      label: t(
        'dataModeling.analysis.inferring',
        'Inferring relationships between collections…'
      ),
      maxValue: totalCollections,
      value: collectionRelationsInferred,
      formatValue: undefined,
    };
  }
  return {
    isIndeterminate: true,
    label: t('dataModeling.analysis.preparing', 'Preparing diagram…'),
  };
}

export type AnalysisProgressStatusProps = {
  step: AnalysisStep;
  sampledCollections: number;
  analyzedCollections: number;
  collectionRelationsInferred: number;
  totalCollections: number;
  onCancelClick: () => void;
};

export const AnalysisProgressStatus: React.FC<AnalysisProgressStatusProps> = ({
  step,
  sampledCollections,
  analyzedCollections,
  collectionRelationsInferred,
  totalCollections,
  onCancelClick,
}) => {
  const darkMode = useDarkMode();
  const t = useTranslation();
  return (
    <ProgressLoaderWithCancel
      darkMode={darkMode}
      variant="success"
      cancelText={t('dataModeling.analysis.cancel', 'Cancel')}
      onCancel={onCancelClick}
      description={t(
        'dataModeling.analysis.description',
        'This might take a few minutes.'
      )}
      {...getProgressPropsFromStatus(t, {
        step,
        sampledCollections,
        analyzedCollections,
        collectionRelationsInferred,
        totalCollections,
      })}
    ></ProgressLoaderWithCancel>
  );
};

export default connect(
  (state: DataModelingState) => {
    const analysisProgress = state.analysisProgress;
    return {
      step: analysisProgress.step,
      sampledCollections: analysisProgress.samplesFetched,
      analyzedCollections: analysisProgress.schemasAnalyzed,
      collectionRelationsInferred: analysisProgress.collectionRelationsInferred,
      totalCollections:
        analysisProgress.currentAnalysisOptions?.collections.length ?? 0,
    };
  },
  {
    onCancelClick: cancelAnalysis,
  }
)(AnalysisProgressStatus);
