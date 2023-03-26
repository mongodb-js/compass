import { GroupForm, mapGroupFormToStageValue } from './group-form';
import {
  GroupSubsetForm,
  mapGroupSubsetFormToStageValue,
} from './group-subset-form';
import { LookupForm, mapLookupFormToStageValue } from './lookup-form';
import { mapMatchFormToStageValue, MatchForm } from './match-form';
import { mapProjectFormToStageValue, ProjectForm } from './project-form';
import { mapSortFormToStageValue, SortForm } from './sort-form';

export type Field = { name: string; value: string };

export type StageCreatorUseCase = {
  id: string;
  title: string;
  description: string;
  stageOperator: string;
  component: React.FunctionComponent<{
    fields: Field[];
    onChange: (data: any) => void;
    initialData?: any;
  }>;
  mapFormStateToStage: (data: any) => Document;
  serverVersion?: string;
};

export const STAGE_CREATOR_USE_CASES: StageCreatorUseCase[] = [
  {
    id: 'match',
    title: 'Match',
    description: 'Filter documents by condition',
    stageOperator: '$match',
    component: MatchForm,
    mapFormStateToStage: mapMatchFormToStageValue,
  },
  {
    id: 'project',
    title: 'Project',
    description: 'Include or exclude fields',
    stageOperator: '$project',
    component: ProjectForm,
    mapFormStateToStage: mapProjectFormToStageValue,
  },
  {
    id: 'sort',
    title: 'Sort',
    description: 'Sort documents by field',
    stageOperator: '$sort',
    component: SortForm,
    mapFormStateToStage: mapSortFormToStageValue,
  },
  {
    id: 'lookup',
    title: 'LookUp',
    description: 'Lookup documents',
    stageOperator: '$lookup',
    component: LookupForm,
    mapFormStateToStage: mapLookupFormToStageValue,
  },
  {
    id: 'group',
    title: 'Group data by',
    description: 'Calculate values for each group',
    stageOperator: '$group',
    component: GroupForm,
    mapFormStateToStage: mapGroupFormToStageValue,
  },
  {
    id: 'group-subset',
    title: 'Return a  subset of values based on their order or rank',
    description: 'Return a  subset of values based on their order or rank',
    stageOperator: '$group',
    component: GroupSubsetForm,
    mapFormStateToStage: mapGroupSubsetFormToStageValue,
    serverVersion: '5.0.0',
  },
];
