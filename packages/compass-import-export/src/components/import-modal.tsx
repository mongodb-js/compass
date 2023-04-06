import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import {
  Button,
  ErrorSummary,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  css,
  cx,
  spacing,
  FormFieldContainer,
  Body,
  Link,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useTrackOnChange } from '@mongodb-js/compass-logging';

import { FINISHED_STATUSES, STARTED } from '../constants/process-status';
import type { ProcessStatus } from '../constants/process-status';
import { ImportPreview } from './import-preview';
import ImportPreviewLoader from './import-preview-loader';
import { ImportOptions } from './import-options';
import type { AcceptedFileType } from '../constants/file-types';
import {
  startImport,
  cancelImport,
  skipCSVAnalyze,
  selectImportFileName,
  setDelimiter,
  setStopOnErrors,
  setIgnoreBlanks,
  closeImport,
  toggleIncludeField,
  setFieldType,
} from '../modules/import';
import type { RootImportState } from '../stores/import-store';
import type { CSVDelimiter, FieldFromCSV } from '../modules/import';
import { ImportFileInput } from './import-file-input';
import type { CSVParsableFieldType } from '../utils/csv';

const closeButtonStyles = css({
  marginRight: spacing[2],
});

const fieldsHeadingStyles = css({
  fontWeight: 'bold',
  paddingBottom: spacing[2],
});

const fieldsHeadingStylesDark = css({
  borderBottom: `2px solid ${palette.gray.dark2}`,
});

const fieldsHeadingStylesLight = css({
  borderBottom: `2px solid ${palette.gray.light2}`,
});

type ImportModalProps = {
  isOpen: boolean;
  ns: string;
  startImport: () => void;
  cancelImport: () => void;
  skipCSVAnalyze: () => void;
  closeImport: () => void;
  errors: Error[];
  status: ProcessStatus;

  /**
   * See `<ImportOptions />`
   */
  selectImportFileName: (fileName: string) => void;
  setDelimiter: (delimiter: CSVDelimiter) => void;
  delimiter: CSVDelimiter;
  fileType: AcceptedFileType | '';
  fileName: string;
  stopOnErrors: boolean;
  setStopOnErrors: (stopOnErrors: boolean) => void;
  ignoreBlanks: boolean;
  setIgnoreBlanks: (ignoreBlanks: boolean) => void;

  /**
   * See `<ImportPreview />`
   */
  fields: {
    path: string;
    checked?: boolean; // CSV placeholder fields don't have checked
    type?: CSVParsableFieldType | 'placeholder'; // Only on csv imports.
  }[];
  values: string[][];
  toggleIncludeField: (path: string) => void;
  setFieldType: (path: string, bsonType: string) => void;
  previewLoaded: boolean;
  csvAnalyzed: boolean;
};

function ImportModal({
  isOpen,
  ns,
  startImport,
  cancelImport,
  closeImport,

  errors,
  status,

  selectImportFileName,
  setDelimiter,
  delimiter,
  fileType,
  fileName,
  stopOnErrors,
  setStopOnErrors,
  ignoreBlanks,
  setIgnoreBlanks,

  fields,
  values,
  toggleIncludeField,
  setFieldType,
  previewLoaded,
  csvAnalyzed,
}: ImportModalProps) {
  const darkMode = useDarkMode();

  const modalBodyRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    cancelImport();
    closeImport();
  }, [closeImport, cancelImport]);

  useEffect(() => {
    // When the errors change and there are new errors, we auto scroll
    // to the end of the modal body to ensure folks see the new errors.
    if (isOpen && errors && modalBodyRef.current) {
      const contentDiv = modalBodyRef.current;
      contentDiv.scrollTop = contentDiv.scrollHeight;
    }
  }, [errors, isOpen]);

  useTrackOnChange(
    'COMPASS-IMPORT-EXPORT-UI',
    (track) => {
      if (isOpen) {
        track('Screen', { name: 'import_modal' });
      }
    },
    [isOpen],
    undefined,
    React
  );

  if (isOpen && !fileName && errors.length === 0) {
    // Show the file input when we don't have a file to import yet.
    return (
      <ImportFileInput
        autoOpen
        onCancel={handleClose}
        fileName={fileName}
        selectImportFileName={selectImportFileName}
      />
    );
  }

  return (
    <Modal
      open={isOpen}
      setOpen={handleClose}
      data-testid="import-modal"
      size={fileType === 'csv' ? 'large' : 'small'}
    >
      <ModalHeader title="Import" subtitle={`To Collection ${ns}`} />
      <ModalBody ref={modalBodyRef}>
        <ImportOptions
          delimiter={delimiter}
          setDelimiter={setDelimiter}
          fileType={fileType}
          fileName={fileName}
          selectImportFileName={selectImportFileName}
          stopOnErrors={stopOnErrors}
          setStopOnErrors={setStopOnErrors}
          ignoreBlanks={ignoreBlanks}
          setIgnoreBlanks={setIgnoreBlanks}
        />
        {fileType === 'csv' && (
          <FormFieldContainer>
            <Body
              as="h3"
              className={cx(
                fieldsHeadingStyles,
                darkMode ? fieldsHeadingStylesDark : fieldsHeadingStylesLight
              )}
            >
              Specify Fields and Types{' '}
              <Link href="https://www.mongodb.com/docs/mongodb-shell/reference/data-types/">
                Learn more about data types
              </Link>
            </Body>
            {csvAnalyzed ? (
              <ImportPreview
                loaded={previewLoaded}
                onFieldCheckedChanged={toggleIncludeField}
                setFieldType={setFieldType}
                values={values}
                fields={fields as FieldFromCSV[]}
              />
            ) : (
              <ImportPreviewLoader />
            )}
          </FormFieldContainer>
        )}
        {errors.length > 0 && (
          <ErrorSummary errors={errors.map((error) => error.message)} />
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          data-testid="import-button"
          onClick={startImport}
          disabled={
            !fileName ||
            status === STARTED ||
            (fileType === 'csv' && !csvAnalyzed)
          }
          variant="primary"
        >
          {status === STARTED ? 'Importing\u2026' : 'Import'}
        </Button>
        <Button
          className={closeButtonStyles}
          data-testid="cancel-button"
          onClick={handleClose}
        >
          {FINISHED_STATUSES.includes(status) ? 'Close' : 'Cancel'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/**
 * Map the state of the store to component properties.
 */
const mapStateToProps = (state: RootImportState) => ({
  ns: state.ns,
  isOpen: state.importData.isOpen,
  errors: state.importData.errors,
  fileType: state.importData.fileType,
  fileName: state.importData.fileName,
  status: state.importData.status,
  delimiter: state.importData.delimiter,
  stopOnErrors: state.importData.stopOnErrors,
  ignoreBlanks: state.importData.ignoreBlanks,
  fields: state.importData.fields,
  values: state.importData.values,
  previewLoaded: state.importData.previewLoaded,
  csvAnalyzed: state.importData.analyzeStatus === 'COMPLETED',
});

/**
 * Export the connected component as the default.
 */
export default connect(mapStateToProps, {
  startImport,
  cancelImport,
  skipCSVAnalyze,
  selectImportFileName,
  setDelimiter,
  setStopOnErrors,
  setIgnoreBlanks,
  closeImport,
  toggleIncludeField,
  setFieldType,
})(ImportModal);
