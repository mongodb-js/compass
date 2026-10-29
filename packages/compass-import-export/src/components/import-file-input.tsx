import React, { useCallback } from 'react';
import {
  Button,
  FileSelector,
  Icon,
  Label,
  css,
  spacing,
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
  selectImportFile: (file: File) => void;
  fileName: string;
};

function ImportFileInput({ selectImportFile, fileName }: ImportFileInputProps) {
  const handleSelect = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        selectImportFile(files[0]);
      }
    },
    [selectImportFile]
  );

  const renderTrigger = useCallback(
    ({ onClick }: { onClick: () => void }) => (
      <Button
        size="small"
        className={buttonStyles}
        onClick={onClick}
        rightGlyph={<Icon glyph="Edit" title={null} fill="currentColor" />}
      >
        <span className={buttonTextStyles}>
          {fileName || 'Select a file\u2026'}
        </span>
      </Button>
    ),
    [fileName]
  );

  return (
    <div className={containerStyles}>
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
