import React, { type ChangeEvent, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Button,
  KeylineCard,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Modal,
  RadioBox,
  RadioBoxGroup,
  css,
  spacing,
  ErrorSummary,
  Label,
  CancelLoader,
  SpinLoader,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

import type { RootState } from '../stores/store';
import {
  cancelExportSchema,
  changeExportSchemaFormat,
  closeExportSchema,
  trackSchemaExported,
  type SchemaFormat,
  type ExportStatus,
  trackSchemaExportFailed,
} from '../stores/schema-export-reducer';

const loaderStyles = css({
  marginTop: spacing[400],
});

const contentContainerStyles = css({
  paddingTop: spacing[400],
  paddingBottom: spacing[400],
});

const codeEditorContainerStyles = css({
  maxHeight: `${spacing[1600] * 4 - spacing[800]}px`,
  overflow: 'auto',
});

const codeStyles = css({
  '& .cm-editor': {
    paddingLeft: spacing[2],
  },
});

const footerStyles = css({
  display: 'flex',
  gap: spacing[200],
});

const exportSchemaFormatOptions: {
  title: string;
  id: SchemaFormat;
}[] = [
  {
    title: 'Standard',
    id: 'standardJSON',
  },
  {
    title: 'MongoDB',
    id: 'mongoDBJSON',
  },
  {
    title: 'Extended',
    id: 'extendedJSON',
  },
];

const formatTypeRadioBoxGroupId = 'export-schema-format-type-box-group';
const formatTypeRadioBoxGroupLabelId = `${formatTypeRadioBoxGroupId}-label`;

const ExportSchemaModal: React.FunctionComponent<{
  errorMessage?: string;
  exportStatus: ExportStatus;
  isOpen: boolean;
  resultId?: string;
  exportFormat: SchemaFormat;
  exportedSchema?: string;
  filename?: string;
  onCancelSchemaExport: () => void;
  onChangeSchemaExportFormat: (format: SchemaFormat) => Promise<void>;
  onClose: () => void;
  onExportedSchemaCopied: () => void;
  onExportedSchema: () => void;
  onSchemaExportFailed: (stage: string) => void;
}> = ({
  errorMessage,
  exportStatus,
  isOpen,
  exportFormat,
  exportedSchema,
  filename,
  onCancelSchemaExport,
  onChangeSchemaExportFormat,
  onClose,
  onExportedSchemaCopied,
  onExportedSchema,
  onSchemaExportFailed,
}) => {
  const onFormatOptionSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();

      void onChangeSchemaExportFormat(event.target.value as SchemaFormat);
    },
    [onChangeSchemaExportFormat]
  );

  const handleSchemaDownload = useCallback(() => {
    try {
      if (!exportedSchema) return;
      const blob = new Blob([exportedSchema], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'export.json';
      link.click();
      window.URL.revokeObjectURL(url);
      onExportedSchema();
    } catch (error) {
      onSchemaExportFailed('download button clicked');
      throw error;
    }
  }, [exportedSchema, filename, onSchemaExportFailed, onExportedSchema]);

  return (
    <Modal open={isOpen} setOpen={onClose}>
      <ModalHeader title="Export Schema" />
      <ModalBody>
        <Label
          htmlFor={formatTypeRadioBoxGroupId}
          id={formatTypeRadioBoxGroupLabelId}
        >
          Schema Format
        </Label>
        <RadioBoxGroup
          aria-labelledby={formatTypeRadioBoxGroupLabelId}
          id={formatTypeRadioBoxGroupId}
          data-testid={formatTypeRadioBoxGroupId}
          onChange={onFormatOptionSelected}
          value={exportFormat}
          size="compact"
        >
          {exportSchemaFormatOptions.map(({ title, id }) => {
            return (
              <RadioBox
                id={`export-schema-format-${id}-button`}
                data-testid={`export-schema-format-${id}-button`}
                checked={exportFormat === id}
                value={id}
                key={id}
              >
                {title}
              </RadioBox>
            );
          })}
        </RadioBoxGroup>
        <div className={contentContainerStyles}>
          {exportStatus === 'inprogress' && (
            <CancelLoader
              className={loaderStyles}
              data-testid="schema-export-loader"
              progressText="Formatting Schema"
              cancelText="Stop"
              onCancel={onCancelSchemaExport}
            />
          )}
          {exportStatus === 'complete' && exportedSchema && (
            <KeylineCard className={codeEditorContainerStyles}>
              <CodemirrorMultilineEditor
                data-testid="export-schema-content"
                language="json"
                className={codeStyles}
                copyable={true}
                showAnnotationsGutter={false}
                showLineNumbers={false}
                formattable={false}
                initialJSONFoldAll={false}
                readOnly
                text={exportedSchema}
                onCopy={onExportedSchemaCopied}
              ></CodemirrorMultilineEditor>
            </KeylineCard>
          )}
          {exportStatus === 'error' && errorMessage && (
            <ErrorSummary
              data-testid="schema-export-error-message"
              errors={[
                `An error occurred during schema export: ${errorMessage}`,
              ]}
            />
          )}
        </div>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button onClick={onClose} variant="default">
          Cancel
        </Button>
        <Button
          variant="primary"
          isLoading={exportStatus === 'inprogress'}
          loadingIndicator={<SpinLoader />}
          disabled={!exportedSchema}
          onClick={handleSchemaDownload}
          data-testid="schema-export-download-button"
        >
          Export
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    exportStatus: state.schemaExport.exportStatus,
    errorMessage: state.schemaExport.errorMessage,
    exportFormat: state.schemaExport.exportFormat,
    isOpen: state.schemaExport.isOpen,
    exportedSchema: state.schemaExport.exportedSchema,
    filename: state.schemaExport.filename,
  }),
  {
    onExportedSchemaCopied: trackSchemaExported,
    onExportedSchema: trackSchemaExported,
    onSchemaExportFailed: trackSchemaExportFailed,
    onCancelSchemaExport: cancelExportSchema,
    onChangeSchemaExportFormat: changeExportSchemaFormat,
    onClose: closeExportSchema,
  }
)(ExportSchemaModal);
