import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';

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
import ImportPreview from './import-preview';
import ImportOptions from './import-options';
import type { AcceptedFileType } from '../constants/file-types';
import formatNumber from '../utils/format-number';
import {
  startImport,
  cancelImport,
  selectImportFileType,
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

type ImportModalProps = {
  isOpen: boolean;
  ns: string;
  startImport: () => void;
  cancelImport: () => void;
  closeImport: () => void;
  errors: Error[];
  status: ProcessStatus;

  /**
   * See `<ImportOptions />`
   */
  selectImportFileType: (fileType: AcceptedFileType) => void;
  selectImportFileName: (fileName: string) => void;
  setDelimiter: (delimeter: string) => void;
  delimiter: string;
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

  /**
   * See `<ImportPreview />`
   */
  fields: {
    path: string;
    checked: boolean;
    type?: string; // Only on csv imports.
  }[];
  values: Document[];
  toggleIncludeField: (path: string) => void;
  setFieldType: (path: string, bsonType: string) => void;
  previewLoaded: boolean;
};

function ImportModal({
  isOpen,
  ns,
  startImport,
  cancelImport,
  closeImport,

  errors,
  status,

  selectImportFileType,
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

  fields,
  values,
  toggleIncludeField,
  setFieldType,
  previewLoaded,
}: ImportModalProps) {
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

  // docsTotal is set to actual value only at the very end of processing a
  // stream of documents
  const isGuesstimated = useMemo(() => docsTotal === -1, [docsTotal]);

  const importWasSuccessful = useMemo(
    () => COMPLETED_STATUSES.includes(status),
    [status]
  );

  return (
    <Modal
      open={isOpen}
      setOpen={handleClose}
      data-testid="import-modal"
      trackingId="import_modal"
    >
      <ModalHeader title="Import" subtitle={`To Collection ${ns}`} />
      <ModalBody>
        <ImportOptions
          delimiter={delimiter}
          setDelimiter={setDelimiter}
          fileType={fileType}
          selectImportFileType={selectImportFileType}
          fileName={fileName}
          selectImportFileName={selectImportFileName}
          stopOnErrors={stopOnErrors}
          setStopOnErrors={setStopOnErrors}
          ignoreBlanks={ignoreBlanks}
          setIgnoreBlanks={setIgnoreBlanks}
        />
        {fileType === 'csv' && (
          <ImportPreview
            loaded={previewLoaded}
            onFieldCheckedChanged={toggleIncludeField}
            setFieldType={setFieldType}
            values={values}
            fields={fields}
          />
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
              disabled={!fileName || status === STARTED}
              variant="primary"
            >
              {status === STARTED ? 'Importing...' : 'Import'}
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
  delimiter: state.importData.delimiter,
  stopOnErrors: state.importData.stopOnErrors,
  ignoreBlanks: state.importData.ignoreBlanks,
  fields: state.importData.fields,
  values: state.importData.values,
  previewLoaded: state.importData.previewLoaded,
});

/**
 * Export the connected component as the default.
 */
export default connect(mapStateToProps, {
  startImport,
  cancelImport,
  selectImportFileType,
  selectImportFileName,
  setDelimiter,
  setStopOnErrors,
  setIgnoreBlanks,
  closeImport,
  toggleIncludeField,
  setFieldType,
})(ImportModal);
