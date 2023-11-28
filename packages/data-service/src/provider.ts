import { createContext, useContext } from 'react';
import type DataService from './data-service';

const DataServiceContext = createContext<DataService | null>(null);

export const DataServiceProvider = DataServiceContext.Provider;

export type DataServiceLocator<
  K extends keyof DataService = keyof DataService,
  L extends keyof DataService = K
> = () => Pick<DataService, K> & Partial<Pick<DataService, L>>;

/**
 * DataService locator method. Generic type can be used to limit the required /
 * available methods on the injected service (only on compilation time, doesn't
 * have the effect otherwise)
 */
export function dataServiceLocator<
  K extends keyof DataService = keyof DataService,
  L extends keyof DataService = K
>(): Pick<DataService, K> & Partial<Pick<DataService, L>> {
  const ds = useContext(DataServiceContext);
  if (!ds) {
    throw new Error('DataService is not available in the component context');
  }
  return ds;
}
