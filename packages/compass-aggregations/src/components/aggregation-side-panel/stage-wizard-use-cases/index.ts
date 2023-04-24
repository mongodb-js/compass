import UseCaseList from './use-case-list';
import SortUseCase from './sort/sort';
import LookupUseCase from './lookup/lookup';
import ProjectUseCase from './project/project';
import GroupWithStatistics from './group/group-with-statistics';

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
    id: 'lookup',
    title:
      'Join documents from different collections to compare their field values',
    stageOperator: '$lookup',
    wizardComponent: LookupUseCase,
  },
  {
    id: 'project',
    title: 'Include or exclude a subset of fields from my documents',
    stageOperator: '$project',
    wizardComponent: ProjectUseCase,
  },
  {
    id: 'group-with-statistics',
    title: 'Compute values within the groups I create',
    stageOperator: '$group',
    wizardComponent: GroupWithStatistics,
  },
];

export { UseCaseList };
