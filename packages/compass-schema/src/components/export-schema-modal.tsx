import React, { type ChangeEvent, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Code,
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
} from '@mongodb-js/compass-components';

import type { RootState } from '../stores/store';
import {
  cancelExportSchema,
  changeExportSchemaFormat,
  closeExportSchema,
  trackSchemaExported,
  type SchemaFormat,
  type ExportStatus,
} from '../stores/schema-export-reducer';

const loaderStyles = css({
  marginTop: spacing[400],
});

const contentContainerStyles = css({
  paddingTop: spacing[400],
  paddingBottom: spacing[400],
});

const codeStyles = css({
  maxHeight: `${spacing[1600] * 4 - spacing[800]}px`,
  overflow: 'auto',
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
  onCancelSchemaExport: () => void;
  onChangeSchemaExportFormat: (format: SchemaFormat) => Promise<void>;
  onClose: () => void;
  onExportedSchemaCopied: () => void;
}> = ({
  errorMessage,
  exportStatus,
  isOpen,
  exportFormat,
  exportedSchema,
  onCancelSchemaExport,
  onChangeSchemaExportFormat,
  onClose,
  onExportedSchemaCopied,
}) => {
  const onFormatOptionSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();

      void onChangeSchemaExportFormat(event.target.value as SchemaFormat);
    },
    [onChangeSchemaExportFormat]
  );

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
          {exportStatus === 'complete' && (
            <Code
              id="export-schema-content"
              data-testid="export-schema-content"
              language="json"
              className={codeStyles}
              copyable={true}
              onCopy={onExportedSchemaCopied}
            >
              {exportedSchema ?? 'Empty'}
            </Code>
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
          onClick={() => {
            /* TODO(COMPASS-8704): download and track with trackSchemaExported */
          }}
          variant="primary"
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
  }),
  {
    onExportedSchemaCopied: trackSchemaExported,
    onCancelSchemaExport: cancelExportSchema,
    onChangeSchemaExportFormat: changeExportSchemaFormat,
    onClose: closeExportSchema,
  }
)(ExportSchemaModal);
