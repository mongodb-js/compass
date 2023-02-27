import React, { createContext, useContext, useMemo, useState } from 'react';

type ImportExportContextType = {
  isImportInProgress: boolean;
  setIsImportInProgress?: (isImportExportInProgress: boolean) => void;
};

export const ImportExportContext = createContext<ImportExportContextType>({
  isImportInProgress: false,
  setIsImportInProgress: undefined,
});

export function useImportExport() {
  const { isImportInProgress, setIsImportInProgress } =
    useContext(ImportExportContext);

  return {
    isImportInProgress,
    setIsImportInProgress,
  };
}

export const ImportExportArea: React.FunctionComponent = ({ children }) => {
  const [isImportInProgress, setIsImportInProgress] = useState(true);

  const importExportContext = useMemo((): ImportExportContextType => {
    return { isImportInProgress, setIsImportInProgress };
  }, [isImportInProgress]);

  return (
    <ImportExportContext.Provider value={importExportContext}>
      <>{children}</>
    </ImportExportContext.Provider>
  );
};
