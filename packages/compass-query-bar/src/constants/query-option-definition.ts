export type QueryOption =
  | 'filter'
  | 'project'
  | 'sort'
  | 'maxTimeMS'
  | 'collation'
  | 'skip'
  | 'limit';

export const OPTION_DEFINITION: {
  [optionName in QueryOption]: {
    type: 'document' | 'numeric';
    placeholder: string;
    link: string;
    label?: string;
  };
} = {
  filter: {
    type: 'document',
    placeholder: "Type a query: { field: 'value' }",
    link: 'https://docs.mongodb.com/compass/current/query/filter/',
  },
  project: {
    type: 'document',
    placeholder: '{ field: 0 }',
    link: 'https://docs.mongodb.com/manual/tutorial/project-fields-from-query-results/',
  },
  sort: {
    type: 'document',
    placeholder: "{ field: -1 } or [['field', -1]]",
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.sort/',
  },
  collation: {
    type: 'document',
    placeholder: "{ locale: 'simple' }",
    link: 'https://docs.mongodb.com/master/reference/collation/',
  },
  skip: {
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.skip/',
  },
  limit: {
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.limit/',
  },
  maxTimeMS: {
    label: 'Max Time MS',
    type: 'numeric',
    placeholder: '60000',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.maxTimeMS/',
  },
};

export type QueryBarOptionProps = { [key in `${QueryOption}String`]: string } &
  { [key in `${QueryOption}Valid`]: boolean } &
  {
    [key in `${QueryOption}Placeholder`]?: string;
  };

export type QueryBarRowLayout = QueryOption | QueryOption[];
export type QueryBarLayout = Array<QueryBarRowLayout>;
