interface Query {
  _id: string;
  _name: string;
  _ns: string;
  _dateSaved: number;
  // Introduced this field in this PR and already
  // saved Queries will not have this field.
  _dateModified?: number;
  collation?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  limit?: number;
  project?: Record<string, unknown>;
  skip?: number;
  sort?: Record<string, number>;
}

type QueryUpdateAttributes = {
  _name: string;
};

type PipelineUpdateAttributes = {
  name: string;
};

declare module '@mongodb-js/compass-query-history' {
  class FavoriteQueryStorage {
    loadAll(): Promise<Query[]>;
    updateAttributes(
      id: string,
      attributes: QueryUpdateAttributes
    ): Promise<Query>;
    delete(id: string): Promise<void>;
  }

  export { Query, FavoriteQueryStorage };
}
