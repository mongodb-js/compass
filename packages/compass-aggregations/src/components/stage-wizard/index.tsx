import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Body,
  Button,
  css,
  KeylineCard,
  Link,
  spacing,
  Badge,
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
import type {
  StoreStage,
  Wizard,
} from '../../modules/pipeline-builder/stage-editor';
import { getSchema } from '../../utils/get-schema';
import { getStageHelpLink } from '../../utils/stage';
import type { SortableProps } from '../pipeline-builder-workspace/pipeline-builder-ui-workspace/sortable-list';
import type { DocumentSchema } from '../../utils/get-schema';
import type { TypeCastTypes } from 'hadron-type-checker';
import { useFieldsSchema } from '@mongodb-js/compass-field-store';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const headerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  gap: spacing[200],
  padding: spacing[400],
  cursor: 'grab',
});

const headingStyles = css({
  display: 'flex',
  gap: spacing[200],
});

const wizardContentStyles = css({
  padding: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const cardFooterStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[400],
});

const cardActionStyles = css({
  display: 'flex',
  gap: spacing[200],
  marginLeft: 'auto',
});

const warningStyles = css({
  width: '300px',
  maxWidth: 'auto',
});

type StageWizardProps = SortableProps & {
  index: number;
  namespace: string;
  useCaseId: string;
  value: string | null;
  syntaxError: SyntaxError | null;
  previousStageFields: DocumentSchema | null;
  onChange: (value: string) => void;
  onCancel: () => void;
  onApply: () => void;
};

// We want to capture the focus in the wizard form on render, and, on cancel,
// return it after the wizard is canceled.
// The focus is returned to the last element that the user interacted with
// outside of the form.
// If the user interacted with other parts of the UI in the meanwhile, it
// generally means they've shifted their attention elsewhere, and sending
// the focus back to the list may be confusing. In such case we will let
// the browser reset the focus after the form will be removed from DOM.
function useGrabFocus<E extends HTMLElement>() {
  const focusContainerRef = useRef<E>(null);
  const returnElementRef = useRef<Element | null>(document.activeElement);

  useEffect(() => {
    if (focusContainerRef.current) {
      const targetSelector = `input:not([aria-hidden="true"]),
         select:not([aria-hidden="true"]),
         textarea:not([aria-hidden="true"]),
         button:not([aria-hidden="true"])`;

      const firstFormControl =
        focusContainerRef.current.querySelector(targetSelector);
      if (
        firstFormControl &&
        'focus' in firstFormControl &&
        typeof firstFormControl.focus === 'function'
      ) {
        firstFormControl.focus();
      }
    }

    function handleFocus(event: FocusEvent) {
      if (
        focusContainerRef.current &&
        !focusContainerRef.current.contains(event.target as Node)
      ) {
        returnElementRef.current = null;
      }
    }

    document.addEventListener('focus', handleFocus, true);

    return () => {
      document.removeEventListener('focus', handleFocus, true);
    };
  }, []);

  const returnFocus = useCallback(() => {
    if (
      returnElementRef.current &&
      'focus' in returnElementRef &&
      typeof returnElementRef.focus === 'function'
    ) {
      (returnElementRef.current as HTMLElement).focus();
    }
  }, []);

  return { focusContainerRef, returnFocus };
}

export const StageWizard = ({
  index,
  namespace,
  useCaseId,
  value,
  syntaxError,
  previousStageFields,
  onChange,
  onCancel: onCancelProp,
  onApply,
  ...sortableProps
}: StageWizardProps) => {
  const { returnFocus, focusContainerRef } = useGrabFocus<HTMLDivElement>();
  const fieldsSchema = useFieldsSchema(namespace);
  const fields: DocumentSchema = useMemo(() => {
    function schemaTypeToKindaTypeCastType(type: string | string[]) {
      // we don't expect any handling for multi-type schemas, pick the first
      // type whatever it is
      type = Array.isArray(type) ? type[0] : type;
      // parsed schema has the bson type Object replaced with Document to avoid
      // collision with JS Objects but that shouldn't be a problem for us
      // because we use these as string values alongside well defined casters.
      return type === 'Document' ? 'Object' : (type as TypeCastTypes);
    }

    return Object.values(fieldsSchema).map((field) => {
      return {
        name: field.name,
        type: schemaTypeToKindaTypeCastType(field.type),
      };
    });
  }, [fieldsSchema]);

  const onCancel = useCallback(() => {
    onCancelProp?.();
    returnFocus();
  }, [onCancelProp, returnFocus]);

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
            <div className={headingStyles}>
              <Body weight="medium">{useCase.title}</Body>
              <Link
                target="_blank"
                href={getStageHelpLink(useCase.stageOperator) as string}
              >
                {useCase.stageOperator}
              </Link>
            </div>
            {useCase.isAtlasOnly && <Badge>Atlas only</Badge>}
          </div>
        </div>
        <div ref={focusContainerRef}>
          <div className={wizardContentStyles}>
            <div data-testid="wizard-form">
              <useCase.wizardComponent
                fields={previousStageFields ?? fields}
                onChange={onChangeWizard}
              />
            </div>
            <div className={cardFooterStyles}>
              <div className={warningStyles}>
                {value && error && (
                  <WarningSummary warnings={[error?.message]} />
                )}
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
      namespace,
      autoPreview,
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = state;

    const wizard = stages[ownProps.index] as Wizard;

    const previousStage = stages
      .slice(0, ownProps.index)
      .reverse()
      .find((x): x is StoreStage => x.type === 'stage' && !x.disabled);

    return {
      id: wizard.id,
      namespace,
      syntaxError: wizard.syntaxError,
      useCaseId: wizard.useCaseId,
      value: wizard.value,
      previousStageFields:
        autoPreview &&
        previousStage?.previewDocs &&
        previousStage?.previewDocs.length > 0
          ? getSchema(
              previousStage.previewDocs.map((doc) => {
                return doc.generateObject();
              })
            )
          : null,
    };
  },
  (dispatch: PipelineBuilderThunkDispatch, ownProps: WizardOwnProps) => ({
    onChange: (value: string) =>
      dispatch(updateWizardValue(ownProps.index, value)),
    onCancel: () => dispatch(removeWizard(ownProps.index)),
    onApply: () => dispatch(convertWizardToStage(ownProps.index)),
  })
)(StageWizard);
