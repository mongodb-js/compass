import React from 'react';
import { Button, FileSelector } from '@mongodb-js/compass-components';

type importDiagramButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'onClick'
> & {
  onImportDiagram: (file: File) => void;
};

export const ImportDiagramButton = ({
  onImportDiagram,
  ...buttonProps
}: importDiagramButtonProps) => {
  return (
    <FileSelector
      id="import-diagram-file-input"
      data-testid="import-diagram-file-input"
      multiple={false}
      accept=".mdm"
      onSelect={(files) => {
        if (files.length === 0) {
          return;
        }
        onImportDiagram(files[0]);
      }}
      trigger={({ onClick }) => (
        <Button {...buttonProps} onClick={onClick}>
          Import Diagram
        </Button>
      )}
    />
  );
};
