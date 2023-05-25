import type { StageWizardFields } from '..';

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
