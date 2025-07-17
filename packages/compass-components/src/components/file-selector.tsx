import React, { useRef } from 'react';

type FileSelectorTriggerProps = {
  onClick: () => void;
};

type FileSelectorProps = {
  id: string;
  dataTestId?: string;
  accept?: string;
  multiple?: boolean;
  onSelect: (files: File[]) => void;
  trigger: (props: FileSelectorTriggerProps) => React.ReactElement;
};

export function FileSelector({
  id,
  dataTestId,
  accept,
  multiple = false,
  onSelect,
  trigger,
}: FileSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFilesChanged = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      onSelect(Array.from(evt.currentTarget.files ?? []));
    },
    [onSelect]
  );

  return (
    <>
      <input
        data-testid={dataTestId ?? 'file-input'}
        ref={inputRef}
        id={`${id}_file_input`}
        name={id}
        type="file"
        multiple={multiple}
        onChange={onFilesChanged}
        style={{ display: 'none' }}
        accept={accept}
      />
      {trigger({
        onClick: () => inputRef.current?.click(),
      })}
    </>
  );
}
