import { z } from '@mongodb-js/compass-user-data';

export const MongoDBDataModelDescriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  /**
   * Connection id associated with the data model at the moment of configuring
   * and analyzing. No connection id means diagram was imported and not attached
   * to a connection. Practically speaking it just means that we can't do
   * anything that would require re-fetching data associated with the diagram
   */
  connectionId: z.string().nullable(),

  // TODO: define rest of the schema based on arch doc / tech design
  edits: z.array(z.unknown()).default([]),
});

export type MongoDBDataModelDescription = z.output<
  typeof MongoDBDataModelDescriptionSchema
>;

export interface DataModelStorage {
  save(description: MongoDBDataModelDescription): Promise<boolean>;
  delete(id: MongoDBDataModelDescription['id']): Promise<boolean>;
  loadAll(): Promise<MongoDBDataModelDescription[]>;
  load(id: string): Promise<MongoDBDataModelDescription | null>;
}
