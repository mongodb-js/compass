import React, { type InputHTMLAttributes, useRef } from 'react';

type FileSelectorTriggerProps = {
  onClick: () => void;
};

type FileSelectorProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'onSelect' | 'type' | 'style' | 'ref'
> & {
  trigger: (props: FileSelectorTriggerProps) => React.ReactElement;
  onSelect: (files: File[]) => void;
};

export function FileSelector({
  trigger,
  onSelect,
  ...props
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
        {...props}
        ref={inputRef}
        type="file"
        onChange={onFilesChanged}
        style={{ display: 'none' }}
      />
      {trigger({
        onClick: () => inputRef.current?.click(),
      })}
    </>
  );
}
