import type {
  ReduxStage,
  WizardStage,
} from '../modules/pipeline-builder/stage-editor';

export class InvalidStageTypeError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function assertReduxStage(
  stage: WizardStage | ReduxStage
): asserts stage is ReduxStage {
  if (stage && stage.type !== 'stage') {
    throw new InvalidStageTypeError('Expected stage to be a ReduxStage');
  }
}
