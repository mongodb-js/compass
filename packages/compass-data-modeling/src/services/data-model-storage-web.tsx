import React from 'react';
import {
  DataModelStorageServiceProvider,
  noopDataModelStorageService,
} from '../provider';

export const DataModelStorageServiceProviderWeb: React.FunctionComponent = ({
  children,
}) => {
  return (
    <DataModelStorageServiceProvider storage={noopDataModelStorageService}>
      {children}
    </DataModelStorageServiceProvider>
  );
};

export default noopDataModelStorageService;
