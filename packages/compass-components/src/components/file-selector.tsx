import React, { type InputHTMLAttributes, useRef } from 'react';
import { css } from '@leafygreen-ui/emotion';

const displayNoneStyles = css({
  // make sure actual input is always hidden (mms is doing something weird
  // forcing these to be visible)
  display: 'none !important',
});

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
        className={displayNoneStyles}
      />
      {trigger(
        // ref is not accessed in the render for rendering purposes, it's
        // accessed in the callback, but the rule is not detecting it
        // eslint-disable-next-line react-hooks/refs
        { onClick: () => inputRef.current?.click() }
      )}
    </>
  );
}
