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
  Link,
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
  downloadSchema,
} from '../stores/schema-export-reducer';

const modalStyles = css({
  width: '610px',
});

const loaderStyles = css({
  marginTop: spacing[400],
});

const contentContainerStyles = css({
  paddingTop: spacing[400],
  paddingBottom: spacing[400],
});

const codeEditorContainerStyles = css({
  height: `${spacing[1600] * 4 - spacing[400]}px`,
  padding: spacing[100],
});

const codeStyles = css({
  '& .cm-editor': {
    paddingLeft: spacing[200],
    maxHeight: `${spacing[1600] * 4 - spacing[800]}px`,
  },
  '& .multiline-editor-actions': {
    marginRight: spacing[300],
  },
});

const footerStyles = css({
  display: 'flex',
  gap: spacing[200],
});

const formatDescriptionStyles = css({
  marginTop: spacing[200],
});

type SupportedFormat = Exclude<SchemaFormat, 'legacyJSON'>;

const exportSchemaFormatOptions: SupportedFormat[] = [
  'standardJSON',
  'mongoDBJSON',
  'expandedJSON',
];

const exportSchemaFormatOptionDetails: Record<
  SupportedFormat,
  {
    title: string;
    description: JSX.Element;
  }
> = {
  standardJSON: {
    title: 'Standard',
    description: (
      <div>
        For broad compatibility with tools and systems that rely on
        standard&nbsp;
        <Link href="https://json-schema.org/specification">JSON Schema</Link>
      </div>
    ),
  },
  mongoDBJSON: {
    title: 'MongoDB',
    description: (
      <div>
        For MongoDB-specific data validation at the database level (includes
        BSON data types)
      </div>
    ),
  },
  expandedJSON: {
    title: 'Expanded',
    description: (
      <div>
        For schema analysis to help with understanding and documenting your data
      </div>
    ),
  },
};

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
  onSchemaDownload: () => void;
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
  onSchemaDownload,
}) => {
  const onFormatOptionSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();

      void onChangeSchemaExportFormat(event.target.value as SchemaFormat);
    },
    [onChangeSchemaExportFormat]
  );

  return (
    <Modal open={isOpen} setOpen={onClose} contentClassName={modalStyles}>
      <ModalHeader title="Export JSON Schema" />
      <ModalBody>
        <Label
          htmlFor={formatTypeRadioBoxGroupId}
          id={formatTypeRadioBoxGroupLabelId}
        >
          Select format:
        </Label>
        <RadioBoxGroup
          aria-labelledby={formatTypeRadioBoxGroupLabelId}
          id={formatTypeRadioBoxGroupId}
          data-testid={formatTypeRadioBoxGroupId}
          onChange={onFormatOptionSelected}
          value={exportFormat}
          size="compact"
        >
          {exportSchemaFormatOptions.map((id) => {
            return (
              <RadioBox
                id={`export-schema-format-${id}-button`}
                data-testid={`export-schema-format-${id}-button`}
                checked={exportFormat === id}
                value={id}
                key={id}
              >
                {exportSchemaFormatOptionDetails[id].title}
              </RadioBox>
            );
          })}
        </RadioBoxGroup>
        {exportFormat !== 'legacyJSON' && (
          <div className={formatDescriptionStyles}>
            {exportSchemaFormatOptionDetails[exportFormat].description}
          </div>
        )}
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
          onClick={onSchemaDownload}
          data-testid="schema-export-download-button"
        >
          Export…
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
    onCancelSchemaExport: cancelExportSchema,
    onChangeSchemaExportFormat: changeExportSchemaFormat,
    onClose: closeExportSchema,
    onSchemaDownload: downloadSchema,
  }
)(ExportSchemaModal);
