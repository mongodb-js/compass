import React, { useCallback, useMemo } from 'react';
import {
  createElectronFileInputBackend,
  FileInput as CompassFileInput,
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
  const onChangeFiles = useCallback(
    (files: string[]) => {
      if (files.length > 0) onChange(files[0]);
    },
    [onChange]
  );

  const backend = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
    const electron: typeof import('@electron/remote') = require('@electron/remote');
    return createElectronFileInputBackend(electron, mode, {
      title: 'Select connections file',
      defaultPath: 'compass-connections.json',
      buttonLabel: 'Select',
    });
  }, [mode]);

  return (
    <CompassFileInput
      disabled={disabled}
      label={label}
      onChange={onChangeFiles}
      id="conn-import-export-file-input"
      accept=".json"
      variant="VERTICAL"
      values={value ? [value] : []}
      backend={backend}
    />
  );
}
