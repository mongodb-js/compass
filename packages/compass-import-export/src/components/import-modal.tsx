import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  css,
  cx,
  spacing,
  FormFieldContainer,
  Body,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useTrackOnChange } from '@mongodb-js/compass-logging';

import {
  FINISHED_STATUSES,
  COMPLETED_STATUSES,
  STARTED,
  COMPLETED,
  COMPLETED_WITH_ERRORS,
  CANCELED,
  FAILED,
  UNSPECIFIED,
} from '../constants/process-status';
import type { ProcessStatus } from '../constants/process-status';
import ProgressBar from './progress-bar';
import { ImportPreview } from './import-preview';
import { ImportOptions } from './import-options';
import type { AcceptedFileType } from '../constants/file-types';
import formatNumber from '../utils/format-number';
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
import { ImportErrorList } from './import-error-list';
import type { RootImportState } from '../stores/import-store';
import type { CSVDelimiter, FieldFromCSV } from '../modules/import';
import { ImportFileInput } from './import-file-input';
import type { CSVParsableFieldType } from '../utils/csv';
import { SpinLoader } from '@mongodb-js/compass-components';

/**
 * Progress messages.
 */
const MESSAGES = {
  [STARTED]: 'Importing documents...',
  [CANCELED]: 'Import canceled',
  [COMPLETED]: 'Import completed',
  [COMPLETED_WITH_ERRORS]: 'Import completed with following errors:',
  [FAILED]: 'Failed to import with the following error:',
  [UNSPECIFIED]: '',
} as const;

const closeButtonStyles = css({
  marginRight: spacing[2],
});

const analyzeStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: `${spacing[4]}px 0`,
});

const analyzeStylesDark = css({
  backgroundColor: palette.gray.dark3,
});

const analyzeStylesLight = css({
  backgroundColor: palette.gray.light3,
});

const loaderStyles = css({
  marginTop: spacing[3],
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[1],
  alignItems: 'center',
});

const explanationTextStyles = css({
  margin: `${spacing[3]}px 0`,
  width: '350px',
  textAlign: 'center',
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
   * See `<ProgressBar />`
   */
  docsTotal: number;
  docsProcessed: number;
  docsWritten: number;
  guesstimatedDocsTotal: number;
  guesstimatedDocsProcessed: number;

  analyzeBytesProcessed: number;
  analyzeBytesTotal: number;

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

  skipCSVAnalyze,

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

  docsTotal,
  docsProcessed,
  docsWritten,
  guesstimatedDocsTotal,
  guesstimatedDocsProcessed,

  analyzeBytesProcessed,
  analyzeBytesTotal,

  fields,
  values,
  toggleIncludeField,
  setFieldType,
  previewLoaded,
  csvAnalyzed,
}: ImportModalProps) {
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const handleCancel = useCallback(() => {
    cancelImport();
  }, [cancelImport]);

  const handleClose = useCallback(() => {
    handleCancel();
    closeImport();
  }, [closeImport, handleCancel]);

  const handleImportBtnClicked = useCallback(() => {
    startImport();
  }, [startImport]);

  const handleSkipCSVAnalyze = useCallback(() => {
    skipCSVAnalyze();
  }, [skipCSVAnalyze]);

  // docsTotal is set to actual value only at the very end of processing a
  // stream of documents
  const isGuesstimated = useMemo(() => docsTotal === -1, [docsTotal]);

  const importWasSuccessful = useMemo(
    () => COMPLETED_STATUSES.includes(status),
    [status]
  );

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

  const darkMode = useDarkMode();

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
        {fileType === 'csv' && csvAnalyzed && (
          <FormFieldContainer>
            <ImportPreview
              loaded={previewLoaded}
              onFieldCheckedChanged={toggleIncludeField}
              setFieldType={setFieldType}
              values={values}
              fields={fields as FieldFromCSV[]}
            />
          </FormFieldContainer>
        )}

        {fileType === 'csv' && !csvAnalyzed && (
          <FormFieldContainer
            className={cx(
              analyzeStyles,
              darkMode ? analyzeStylesDark : analyzeStylesLight
            )}
          >
            <Body weight="medium">Detecting field types</Body>
            {analyzeBytesTotal && (
              <div className={loaderStyles}>
                <SpinLoader />
                <Body>
                  {Math.round(
                    (analyzeBytesProcessed / analyzeBytesTotal) * 100
                  )}
                  %
                </Body>
              </div>
            )}
            <Body className={explanationTextStyles}>
              We are scanning your CSV file row by row to detect the field
              types. You can skip this step and manually assign field types at
              any point during the process.
            </Body>
            <Button onClick={handleSkipCSVAnalyze}>Skip</Button>
          </FormFieldContainer>
        )}
        <ProgressBar
          status={status}
          withErrors={errors.length > 0}
          cancel={cancelImport}
          docsWritten={docsWritten}
          docsProcessed={Math.max(docsProcessed, guesstimatedDocsProcessed)}
          docsTotal={
            // When guesstimating, guessed total might be too low, in that
            // case the most reasonable thing to do would be to fallback to
            // currently processed number
            isGuesstimated
              ? Math.max(docsProcessed, guesstimatedDocsTotal)
              : docsTotal
          }
          progressLabel={(written: number, total: number) => {
            return `${formatNumber(written)}\u00a0/\u00a0${
              isGuesstimated ? '~' : ''
            }${formatNumber(total)}`;
          }}
          progressTitle={(written: number, total: number) => {
            return `Imported ${formatNumber(written)} out of ${
              isGuesstimated ? 'approximately ' : ''
            }${formatNumber(total)} documents`;
          }}
          message={MESSAGES[status]}
        />
        <ImportErrorList errors={errors} />
      </ModalBody>
      <ModalFooter>
        {importWasSuccessful ? (
          <Button
            data-testid="done-button"
            onClick={handleClose}
            variant="primary"
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              data-testid="import-button"
              onClick={handleImportBtnClicked}
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
          </>
        )}
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
  docsTotal: state.importData.docsTotal,
  docsProcessed: state.importData.docsProcessed,
  docsWritten: state.importData.docsWritten,
  guesstimatedDocsTotal: state.importData.guesstimatedDocsTotal,
  guesstimatedDocsProcessed: state.importData.guesstimatedDocsProcessed,
  analyzeBytesProcessed: state.importData.analyzeBytesProcessed,
  analyzeBytesTotal: state.importData.analyzeBytesTotal,
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
