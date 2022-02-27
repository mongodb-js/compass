import type { ReadPreferenceMode } from 'mongodb';
import { ReadPreference as MongoReadPreference } from 'mongodb';

interface ReadPreference {
  title: string;
  id: ReadPreferenceMode;
}

export const readPreferences: ReadPreference[] = [
  {
    title: 'Primary',
    id: MongoReadPreference.PRIMARY,
  },
  {
    title: 'Primary Preferred',
    id: MongoReadPreference.PRIMARY_PREFERRED,
  },
  {
    title: 'Secondary',
    id: MongoReadPreference.SECONDARY,
  },
  {
    title: 'Secondary Preferred',
    id: MongoReadPreference.SECONDARY_PREFERRED,
  },
  {
    title: 'Nearest',
    id: MongoReadPreference.NEAREST,
  },
];
