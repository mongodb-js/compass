import React from 'react';
import {
  Button,
  type ButtonProps,
  FileSelector,
  Tooltip,
  useTranslation,
} from '@mongodb-js/compass-components';

type ImportDiagramButtonProps = Omit<ButtonProps, 'onClick'> & {
  onImportDiagram: (file: File) => void;
};

export const ImportDiagramButton = ({
  onImportDiagram,
  ...buttonProps
}: ImportDiagramButtonProps) => {
  const t = useTranslation();
  return (
    <Tooltip
      trigger={
        <span>
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
                {t('dataModeling.import.button', 'Import diagram')}
              </Button>
            )}
          />
        </span>
      }
    >
      {t(
        'dataModeling.import.tooltip',
        'Only MDM files exported from Compass or Atlas Data Explorer can be imported.'
      )}
    </Tooltip>
  );
};
