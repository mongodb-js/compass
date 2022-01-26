enum MongoReadPreference {
  PRIMARY = "primary",
  PRIMARY_PREFERRED = "primaryPreferred",
  SECONDARY = "secondary",
  SECONDARY_PREFERRED = "secondaryPreferred",
  NEAREST = "nearest"
}

interface ReadPreference {
  title: string;
  id: any;
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
