import React, { useCallback, useMemo } from 'react';
import {
  FileInput,
  createElectronFileInputBackend,
} from '@mongodb-js/compass-components';

type ImportFileInputProps = {
  autoOpen?: boolean;
  onCancel?: () => void;
  selectImportFileName: (fileName: string) => void;
  fileName: string;
};

function ImportFileInput({
  autoOpen,
  onCancel,
  selectImportFileName,
  fileName,
}: ImportFileInputProps) {
  const handleChooseFile = useCallback(
    (files: string[]) => {
      if (files.length > 0) {
        void selectImportFileName(files[0]);
      } else if (typeof onCancel === 'function') {
        onCancel();
      }
    },
    [onCancel, selectImportFileName]
  );

  const backend = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports, @typescript-eslint/no-var-requires
    const electron: typeof import('@electron/remote') = require('@electron/remote');
    return createElectronFileInputBackend(electron, 'open', {
      title: 'Select JSON or CSV to import',
      buttonLabel: 'Select',
    });
  }, []);

  const values = fileName ? [fileName] : undefined;

  return (
    <FileInput
      autoOpen={autoOpen}
      label="Import file:"
      id="import-file"
      onChange={handleChooseFile}
      values={values}
      variant="small"
      backend={backend}
    />
  );
}

export { ImportFileInput };
