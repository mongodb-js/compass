import React, { useCallback, useMemo, useState } from 'react';
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
  value: string | null;
  syntaxError: SyntaxError | null;
  onChange: (value: string) => void;
  onCancel: () => void;
  onApply: () => void;
};

export const StageWizard = ({
  index,
  useCaseId,
  value,
  syntaxError,
  onChange,
  onCancel,
  onApply,
}: StageWizardProps) => {
  const [formError, setFormError] = useState<Error | null>(null);
  const useCase = useMemo<StageWizardUseCase | undefined>(() => {
    return STAGE_WIZARD_USE_CASES.find((useCase) => useCase.id === useCaseId);
  }, [useCaseId]);

  const onChangeWizard = useCallback(
    (value: string, error: Error | null) => {
      if (!error) {
        setFormError(null);
        return onChange(value);
      }
      setFormError(error);
    },
    [setFormError, onChange]
  );

  if (!useCase) {
    return null;
  }

  const error = syntaxError || formError;
  const isApplyDisabled = !!error || !value;

  return (
    <KeylineCard
      data-testid="wizard-card"
      data-wizard-index={index}
      className={containerStyles}
    >
      <div className={headerStyles}>
        <Body weight="medium">{useCase.title}</Body>
        <Badge>{useCase.stageOperator}</Badge>
      </div>
      <div data-testid="wizard-form">
        <useCase.wizardComponent onChange={onChangeWizard} />
      </div>
      <div className={cardFooterStyles}>
        {value && error && <WarningSummary warnings={[error?.message]} />}
        <div className={cardActionStyles}>
          <Button data-testid="wizard-cancel-action" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            data-testid="wizard-apply-action"
            onClick={onApply}
            variant="primary"
            disabled={isApplyDisabled}
          >
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
    const wizard = state.pipelineBuilder.stageEditor.stages[
      ownProps.index
    ] as Wizard;

    return {
      id: wizard.id,
      syntaxError: wizard.syntaxError,
      useCaseId: wizard.useCaseId,
      value: wizard.value,
    };
  },
  (dispatch: PipelineBuilderThunkDispatch, ownProps: WizardOwnProps) => ({
    onChange: (value: string) =>
      dispatch(updateWizardValue(ownProps.index, value)),
    onCancel: () => dispatch(removeWizard(ownProps.index)),
    onApply: () => dispatch(convertWizardToStage(ownProps.index)),
  })
)(StageWizard);
