import React, { useCallback } from 'react';
import { FileInput } from '@mongodb-js/compass-components';

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

  const values = fileName ? [fileName] : undefined;

  return (
    <FileInput
      autoOpen={autoOpen}
      label="Import file:"
      id="import-file"
      onChange={handleChooseFile}
      values={values}
      variant="small"
      mode="open"
      title="Select JSON or CSV to import"
      buttonLabel="Select"
    />
  );
}

export { ImportFileInput };
