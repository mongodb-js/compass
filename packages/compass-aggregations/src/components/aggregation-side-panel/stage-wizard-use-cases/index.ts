export type StageWizardUseCase = {
  id: string;
  title: string;
  stageOperator: string;
  wizardComponent: React.FunctionComponent;
  serverVersion?: string;
};

export const STAGE_WIZARD_USE_CASES: StageWizardUseCase[] = [];
