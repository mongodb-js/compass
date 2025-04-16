type MongoDBDataModelDescription = unknown;

export interface DataModelStorage {
  get(): MongoDBDataModelDescription;
}
