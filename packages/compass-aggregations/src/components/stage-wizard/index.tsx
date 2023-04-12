import React, { useMemo } from 'react';
import {
  Badge,
  Body,
  Button,
  css,
  KeylineCard,
  spacing,
  WarningSummary,
} from '@mongodb-js/compass-components';
import type { StageWizardUseCase } from '../aggregation-side-panel/stage-wizard-use-cases';
import { STAGE_WIZARD_USE_CASES } from '../aggregation-side-panel/stage-wizard-use-cases';
import { connect } from 'react-redux';
import type { PipelineBuilderThunkDispatch, RootState } from '../../modules';
import {
  convertWizardToStage,
  removeWizard,
  updateWizardValue,
} from '../../modules/pipeline-builder/stage-editor';
import type { Wizard } from '../../modules/pipeline-builder/stage-editor';

const containerStyles = css({
  padding: spacing[3],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
});

const headerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const cardFooterStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[3],
});

const cardActionStyles = css({
  display: 'flex',
  gap: spacing[2],
  marginLeft: 'auto',
});

type StageWizardProps = {
  index: number;
  useCaseId: string;
  syntaxError?: SyntaxError;
  onChange: (value: string) => void;
  onCancel: () => void;
  onApply: () => void;
};

export const StageWizard = ({
  useCaseId,
  syntaxError,
  onChange,
  onCancel,
  onApply,
}: StageWizardProps) => {
  const useCase = useMemo<StageWizardUseCase | undefined>(() => {
    return STAGE_WIZARD_USE_CASES.find((useCase) => useCase.id === useCaseId);
  }, [useCaseId]);

  if (!useCase) {
    return null;
  }

  return (
    <KeylineCard className={containerStyles}>
      <div className={headerStyles}>
        <Body weight="medium">{useCase.title}</Body>
        <Badge>{useCase.stageOperator}</Badge>
      </div>
      <useCase.wizardComponent onChange={onChange} />
      <div className={cardFooterStyles}>
        {syntaxError && <WarningSummary warnings={[syntaxError.message]} />}
        <div className={cardActionStyles}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onApply} variant="primary" disabled={!!syntaxError}>
            Apply
          </Button>
        </div>
      </div>
    </KeylineCard>
  );
};

type WizardOwnProps = {
  index: number;
};

export default connect(
  (state: RootState, ownProps: WizardOwnProps) => {
    const stage = state.pipelineBuilder.stageEditor.stages[
      ownProps.index
    ] as Wizard;

    return {
      id: stage.id,
      error: stage.error,
      useCaseId: stage.useCaseId,
    };
  },
  (dispatch: PipelineBuilderThunkDispatch, ownProps: WizardOwnProps) => ({
    onChange: (value: string) =>
      dispatch(updateWizardValue(ownProps.index, value)),
    onCancel: () => dispatch(removeWizard(ownProps.index)),
    onApply: () => dispatch(convertWizardToStage(ownProps.index)),
  })
)(StageWizard);
