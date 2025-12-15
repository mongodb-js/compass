import React from 'react';
import {
  Button,
  type ButtonProps,
  FileSelector,
} from '@mongodb-js/compass-components';

type ImportDiagramButtonProps = Omit<ButtonProps, 'onClick'> & {
  onImportDiagram: (file: File) => void;
};

export const ImportDiagramButton = ({
  onImportDiagram,
  ...buttonProps
}: ImportDiagramButtonProps) => {
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
          Import diagram
        </Button>
      )}
    />
  );
};
