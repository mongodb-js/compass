import UseCaseList from './use-case-list';
import SortUseCase from './sort/sort';
import ProjectIncludeUseCase from './project/project-include';
import ProjectExcludeUseCase from './project/project-exclude';

export type StageWizardUseCase = {
  id: string;
  title: string;
  stageOperator: string;
  wizardComponent: React.FunctionComponent<{
    fields: string[];
    onChange: (value: string, validationError: Error | null) => void;
  }>;
  serverVersion?: string;
};

export const STAGE_WIZARD_USE_CASES: StageWizardUseCase[] = [
  {
    id: 'sort',
    title:
      'Sort documents in [ascending/descending] order based on a single or a set of fields',
    stageOperator: '$sort',
    wizardComponent: SortUseCase,
  },
  {
    id: 'project-include',
    title: 'Include a subset of fields on my documents',
    stageOperator: '$project',
    wizardComponent: ProjectIncludeUseCase,
  },
  {
    id: 'project-exclude',
    title: 'Exclude a subset of fields on my documents',
    stageOperator: '$project',
    wizardComponent: ProjectExcludeUseCase,
  },
];

export { UseCaseList };
