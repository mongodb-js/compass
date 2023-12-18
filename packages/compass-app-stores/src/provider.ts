import type { MongoDBInstance } from 'mongodb-instance-model';
import { createContext, useContext } from 'react';

export const InstanceContext = createContext<MongoDBInstance | null>(null);

export const MongoDBInstanceProvider = InstanceContext.Provider;

export const mongoDBInstanceLocator = (): MongoDBInstance => {
  const instance = useContext(InstanceContext);
  if (!instance) {
    throw new Error('No MongoDBInstance available in this context');
  }
  return instance;
};

export type { MongoDBInstance };
