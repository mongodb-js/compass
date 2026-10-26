import React, { useCallback, useEffect, useRef } from 'react';
import {
  Button,
  FileSelector,
  Icon,
  Label,
  css,
  spacing,
  useInitialValue,
} from '@mongodb-js/compass-components';

const inputId = 'import-file_file_input';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  marginTop: spacing[200],
  marginBottom: spacing[200],
});

const buttonStyles = css({
  border: 'none',
  background: 'none',
  fontWeight: 'normal',
  '&:hover, &:active': {
    background: 'none',
    boxShadow: 'none',
  },
});

const buttonTextStyles = css({
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
});

type ImportFileInputProps = {
  autoOpen?: boolean;
  onCancel?: () => void;
  selectImportFile: (file: File) => void;
  fileName: string;
};

function ImportFileInput({
  autoOpen,
  onCancel,
  selectImportFile,
  fileName,
}: ImportFileInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initialAutoOpen = useInitialValue(autoOpen);

  const handleSelect = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        selectImportFile(files[0]);
      }
    },
    [selectImportFile]
  );

  // React doesn't support onCancel on <input>, but the event bubbles up from
  // the hidden file input when the user dismisses the file dialog.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onCancel) {
      return;
    }
    container.addEventListener('cancel', onCancel);
    return () => container.removeEventListener('cancel', onCancel);
  }, [onCancel]);

  useEffect(() => {
    if (initialAutoOpen) {
      buttonRef.current?.click();
    }
  }, [initialAutoOpen]);

  const renderTrigger = useCallback(
    ({ onClick }: { onClick: () => void }) => (
      <Button
        ref={buttonRef}
        size="small"
        className={buttonStyles}
        onClick={onClick}
        rightGlyph={<Icon glyph="Edit" title={null} fill="currentColor" />}
      >
        <span className={buttonTextStyles}>{fileName || 'Select a file…'}</span>
      </Button>
    ),
    [fileName]
  );

  return (
    <div ref={containerRef} className={containerStyles}>
      <Label htmlFor={inputId}>Import file:</Label>
      <FileSelector
        id={inputId}
        data-testid="import-file-input"
        multiple={false}
        onSelect={handleSelect}
        trigger={renderTrigger}
      />
    </div>
  );
}

export { ImportFileInput };
