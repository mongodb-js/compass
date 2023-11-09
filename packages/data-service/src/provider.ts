import { createContext, useContext } from 'react';
import type DataService from './data-service';

const DataServiceContext = createContext<DataService | null>(null);

export const DataServiceProvider = DataServiceContext.Provider;

/**
 * DataService locator method. Generic type can be used to limit the required /
 * available methods on the injected service (only on compilation time, doesn't
 * have the effect otherwise)
 */
export function dataServiceLocator<
  K extends keyof DataService = keyof DataService
>(): Pick<DataService, K> {
  const ds = useContext(DataServiceContext);
  if (!ds) {
    throw new Error('DataService is not available in the component context');
  }
  return ds;
}
