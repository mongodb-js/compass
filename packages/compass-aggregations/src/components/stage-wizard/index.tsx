import React, { useMemo } from 'react';
import {
  Badge,
  Body,
  Button,
  css,
  KeylineCard,
  spacing,
} from '@mongodb-js/compass-components';
import type { StageWizardUseCase } from '../aggregation-side-panel/stage-wizard-use-cases';
import { STAGE_WIZARD_USE_CASES } from '../aggregation-side-panel/stage-wizard-use-cases';

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
  id: string;
  onCancel: () => void;
  onApply: () => void;
};

export const StageWizard = ({ id, onCancel, onApply }: StageWizardProps) => {
  const useCase = useMemo<StageWizardUseCase | undefined>(() => {
    return STAGE_WIZARD_USE_CASES.find((useCase) => useCase.id === id);
  }, [id]);

  if (!useCase) {
    return null;
  }

  return (
    <KeylineCard className={containerStyles}>
      <div className={headerStyles}>
        <Body weight="medium">{useCase.title}</Body>
        <Badge>{useCase.stageOperator}</Badge>
      </div>
      <useCase.wizardComponent />
      <div className={cardFooterStyles}>
        <div className={cardActionStyles}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onApply} variant="primary">
            Apply
          </Button>
        </div>
      </div>
    </KeylineCard>
  );
};

export default StageWizard;
