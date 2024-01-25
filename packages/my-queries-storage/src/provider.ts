import { createContext, useContext } from 'react';
import type { PipelineStorage } from './pipeline-storage';

const PipelineStorageContext = createContext<PipelineStorage | null>(null);

export const PipelineStorageProvider = PipelineStorageContext.Provider;

export const pipelineStorageLocator = (): PipelineStorage => {
  const pipelineStorage = useContext(PipelineStorageContext);
  if (!pipelineStorage) {
    throw new Error('No PipelineStorage available in this context');
  }
  return pipelineStorage;
};

export type { PipelineStorage };
