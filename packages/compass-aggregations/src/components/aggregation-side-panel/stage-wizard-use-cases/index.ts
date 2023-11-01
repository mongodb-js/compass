import UseCaseCard from './use-case-card';
import SortUseCase from './sort/sort';
import LookupUseCase from './lookup/lookup';
import ProjectUseCase from './project/project';
import BasicGroupUseCase from './group/basic-group';
import GroupWithStatistics from './group/group-with-statistics';
import MatchUseCase from './match/match';
import GroupWithSubset from './group/group-with-subset';
import TextSearch from './search/text-search';
import type { FieldSchema } from '../../../utils/get-schema';

export type StageWizardFields = FieldSchema[];

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
  isAtlasOnly?: boolean;
};

export const STAGE_WIZARD_USE_CASES: StageWizardUseCase[] = [
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
  {
    id: 'group-with-subset',
    title: 'Return a subset of values based on their order or rank',
    stageOperator: '$group',
    wizardComponent: GroupWithSubset,
  },
  {
    id: 'project',
    title: 'Include or exclude a subset of fields from my documents',
    stageOperator: '$project',
    wizardComponent: ProjectUseCase,
  },
  {
    id: 'sort',
    title: 'Sort documents based on a single or set of fields',
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
    id: 'text-search',
    title: 'Search for a text field across all documents in a collection',
    stageOperator: '$search',
    wizardComponent: TextSearch,
    isAtlasOnly: true,
  },
];

export { UseCaseCard };
