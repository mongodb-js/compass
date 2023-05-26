import type { StageWizardFields } from '../src/components/aggregation-side-panel/stage-wizard-use-cases';

export const SAMPLE_FIELDS: StageWizardFields = [
  {
    name: '_id',
    type: 'ObjectId',
  },
  {
    name: 'name',
    type: 'String',
  },
  {
    name: 'age',
    type: 'Double',
  },
  {
    name: 'isActive',
    type: 'Boolean',
  },
  {
    name: 'doj',
    type: 'Date',
  },
];
