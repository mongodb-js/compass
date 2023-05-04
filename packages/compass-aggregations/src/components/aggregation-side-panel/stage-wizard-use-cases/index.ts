import UseCaseList from './use-case-list';
import SortUseCase from './sort/sort';
import LookupUseCase from './lookup/lookup';
import ProjectUseCase from './project/project';
import BasicGroupUseCase from './group/basic-group';
import GroupWithStatistics from './group/group-with-statistics';
import MatchUseCase from './match/match';
import type { TypeCastTypes } from 'hadron-type-checker';

export type StageWizardFields = {
  name: string;
  type: TypeCastTypes;
}[];

export type WizardComponentProps = {
  fields: StageWizardFields;
  onChange: (value: string, validationError: Error | null) => void;
};

export type StageWizardUseCase = {
  id: string;
  title: string;
  stageOperator: string;
  wizardComponent: React.FunctionComponent<WizardComponentProps>;
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
    id: 'match',
    title: 'Find all the documents that match one or more conditions',
    stageOperator: '$match',
    wizardComponent: MatchUseCase,
  },
  {
    id: 'basic-group',
    title: 'Group my documents based on their field values',
    stageOperator: '$group',
    wizardComponent: BasicGroupUseCase,
  },
  {
    id: 'group-with-statistics',
    title: 'Compute values within the groups I create',
    stageOperator: '$group',
    wizardComponent: GroupWithStatistics,
  },
];

export { UseCaseList };
