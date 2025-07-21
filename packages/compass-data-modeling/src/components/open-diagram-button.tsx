import React from 'react';
import { Button, FileSelector } from '@mongodb-js/compass-components';

type OpenDiagramButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'onClick'
> & {
  onImportDiagram: (file: File) => void;
};

export const OpenDiagramButton = ({
  onImportDiagram,
  ...buttonProps
}: OpenDiagramButtonProps) => {
  return (
    <FileSelector
      id="open-diagram-file-input"
      multiple={false}
      accept=".compass"
      onSelect={(files) => {
        if (files.length === 0) {
          return;
        }
        onImportDiagram(files[0]);
      }}
      trigger={({ onClick }) => (
        <Button {...buttonProps} onClick={onClick}>
          Open Diagram
        </Button>
      )}
    />
  );
};
