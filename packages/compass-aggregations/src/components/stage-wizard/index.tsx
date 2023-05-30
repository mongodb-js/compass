import React, { useCallback, useMemo, useState } from 'react';
import {
  Body,
  Button,
  css,
  KeylineCard,
  Link,
  spacing,
  WarningSummary,
} from '@mongodb-js/compass-components';
import type {
  StageWizardUseCase,
  WizardComponentProps,
} from '../aggregation-side-panel/stage-wizard-use-cases';
import { STAGE_WIZARD_USE_CASES } from '../aggregation-side-panel/stage-wizard-use-cases';
import { connect } from 'react-redux';
import type { PipelineBuilderThunkDispatch, RootState } from '../../modules';
import {
  convertWizardToStage,
  removeWizard,
  updateWizardValue,
} from '../../modules/pipeline-builder/stage-editor';
import type {
  StoreStage,
  Wizard,
} from '../../modules/pipeline-builder/stage-editor';
import { getSchema } from '../../utils/get-schema';
import { getStageHelpLink } from '../../utils/stage';
import type { SortableProps } from '../pipeline-builder-workspace/pipeline-builder-ui-workspace/sortable-list';
import type { FieldSchema } from '../../utils/get-schema';
import type { TypeCastTypes } from 'hadron-type-checker';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
});

const headerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  padding: spacing[3],
  cursor: 'grab',
});

const wizardContentStyles = css({
  padding: spacing[3],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
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

const warningStyles = css({
  width: '300px',
  maxWidth: 'auto',
});

type StageWizardProps = SortableProps & {
  index: number;
  useCaseId: string;
  value: string | null;
  syntaxError: SyntaxError | null;
  fields: WizardComponentProps['fields'];
  onChange: (value: string) => void;
  onCancel: () => void;
  onApply: () => void;
};

export const StageWizard = ({
  index,
  useCaseId,
  value,
  syntaxError,
  fields,
  onChange,
  onCancel,
  onApply,
  ...sortableProps
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

  const { setNodeRef, style, listeners } = sortableProps;

  return (
    <div ref={setNodeRef} style={style}>
      <KeylineCard
        data-testid="wizard-card"
        data-wizard-index={index}
        className={containerStyles}
      >
        <div {...listeners}>
          <div className={headerStyles}>
            <Body weight="medium">{useCase.title}</Body>
            <Link
              target="_blank"
              href={getStageHelpLink(useCase.stageOperator) as string}
            >
              {useCase.stageOperator}
            </Link>
          </div>
        </div>
        <div className={wizardContentStyles}>
          <div data-testid="wizard-form">
            <useCase.wizardComponent
              fields={fields}
              onChange={onChangeWizard}
            />
          </div>
          <div className={cardFooterStyles}>
            <div className={warningStyles}>
              {value && error && <WarningSummary warnings={[error?.message]} />}
            </div>
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
        </div>
      </KeylineCard>
    </div>
  );
};

type WizardOwnProps = {
  index: number;
};

export default connect(
  (state: RootState, ownProps: WizardOwnProps) => {
    const {
      autoPreview,
      fields: initialFields,
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = state;

    const wizard = stages[ownProps.index] as Wizard;

    const previousStage = stages
      .slice(0, ownProps.index)
      .reverse()
      .find((x): x is StoreStage => x.type === 'stage' && !x.disabled);

    const mappedInitialFields = (
      initialFields as {
        name: string;
        description?: string;
      }[]
    ).map<FieldSchema>(({ name, description }) => {
      // parsed schema has the bson type Object replaced with
      // Document to avoid collision with JS Objects but that
      // shouldn't be a problem for us because we use these
      // as string values alongside well defined casters.
      const type =
        description === 'Document'
          ? 'Object'
          : ((description ?? 'String') as TypeCastTypes);

      return { name, type };
    });
    const previousStageFieldsWithSchema = getSchema(
      previousStage?.previewDocs ?? []
    );

    const fields =
      previousStageFieldsWithSchema.length > 0 && autoPreview
        ? previousStageFieldsWithSchema
        : mappedInitialFields;

    return {
      id: wizard.id,
      syntaxError: wizard.syntaxError,
      useCaseId: wizard.useCaseId,
      value: wizard.value,
      fields,
    };
  },
  (dispatch: PipelineBuilderThunkDispatch, ownProps: WizardOwnProps) => ({
    onChange: (value: string) =>
      dispatch(updateWizardValue(ownProps.index, value)),
    onCancel: () => dispatch(removeWizard(ownProps.index)),
    onApply: () => dispatch(convertWizardToStage(ownProps.index)),
  })
)(StageWizard);
