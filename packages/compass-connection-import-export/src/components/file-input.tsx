import React, { useCallback } from 'react';
import {
  FilePickerDialog,
  useTranslation,
} from '@mongodb-js/compass-components';

type FileInputProps = {
  label: string;
  value?: string | null;
  mode: 'open' | 'save';
  disabled: boolean;
  onChange: (filename: string) => void;
};

export function FileInput({
  label,
  value,
  mode,
  disabled,
  onChange,
}: FileInputProps): React.ReactElement {
  const t = useTranslation();
  const onChangeFiles = useCallback(
    (files: string[]) => {
      if (files.length > 0) onChange(files[0]);
    },
    [onChange]
  );

  return (
    <FilePickerDialog
      disabled={disabled}
      label={label}
      onChange={onChangeFiles}
      id="conn-import-export-file-input"
      accept=".json"
      variant="vertical"
      values={value ? [value] : []}
      title={t(
        'connections.importExport.selectFile',
        'Select connections file'
      )}
      defaultPath="compass-connections.json"
      mode={mode}
      buttonLabel={t('connections.importExport.select', 'Select')}
    />
  );
}
