import React, { useCallback } from 'react';
import { FileInput as CompassFileInput } from '@mongodb-js/compass-components';

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
  const onChangeFiles = useCallback(
    (files: string[]) => {
      if (files.length > 0) onChange(files[0]);
    },
    [onChange]
  );

  return (
    <CompassFileInput
      disabled={disabled}
      label={label}
      onChange={onChangeFiles}
      id="conn-import-export-file-input"
      accept=".json"
      variant="vertical"
      values={value ? [value] : []}
      title="Select connections file"
      defaultPath="compass-connections.json"
      mode={mode}
      buttonLabel="Select"
    />
  );
}
