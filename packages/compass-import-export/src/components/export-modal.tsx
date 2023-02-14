import React, { useCallback, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Icon,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Modal,
  FormFieldContainer,
  Radio,
  RadioGroup,
  css,
  cx,
  spacing,
  Code,
  useDarkMode,
} from '@mongodb-js/compass-components';

import ExportSelectOutput from './export-select-output';
import { ExportSelectFields } from './export-select-fields';
import ErrorBox from './error-box';
import revealFile from '../utils/reveal-file';
import formatNumber from '../utils/format-number';
import { STARTED, COMPLETED } from '../constants/process-status';
import type { ProcessStatus } from '../constants/process-status';
import { QUERY, FIELDS, FILETYPE } from '../constants/export-step';
import type { ExportStep } from '../constants/export-step';
import {
  closeExport,
  startExport,
  sampleFields,
  cancelExport,
  updateSelectedFields,
  changeExportStep,
  selectExportFileType,
  selectExportFileName,
  toggleFullCollection,
} from '../modules/export';
import type { ExportQueryType } from '../modules/export';
import type { RootExportState } from '../stores/export-store';
import { getQueryAsShellJSString } from '../utils/get-shell-js';
import { useTrackOnChange } from '@mongodb-js/compass-logging';

const optionRadioStyles = css({
  // Override LeafyGreen's radio group default width.
  width: 'auto',
});

const queryViewerStyles = css({
  marginTop: spacing[1],
  marginBottom: spacing[2],
});

const queryViewerDisabledStyles = css({
  opacity: 0.5,
});

const actionContainerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
});

const rightActionStyles = css({
  gap: spacing[2],
  display: 'flex',
});

function ExportOptions({
  count,
  ns,
  query,
  isFullCollection,
  toggleFullCollection,
}: {
  count: number | null;
  ns: string; // Namespace
  query: ExportQueryType;
  isFullCollection: boolean;
  toggleFullCollection: () => void;
}) {
  /**
   * Handle switching between filtered and full export.
   */
  const handleExportOptionSelect = useCallback(() => {
    toggleFullCollection();
  }, [toggleFullCollection]);

  const resultsSummary = useMemo(() => {
    const hasCount = typeof count === 'number';
    return hasCount ? ` — ${formatNumber(count)} results` : '';
  }, [count]);

  const codeString = useMemo(
    () => getQueryAsShellJSString(ns, query),
    [ns, query]
  );

  // TODO(LG-2741): Once we update the `radio-group` package we can remove this explicit theme fetch.
  // In the LeafyGreen package `@leafygreen-ui/radio-group` version `10.0.3` the
  // radio component doesn't listen to the `darkMode` that the `LeafyGreenProvider` provides.
  // So for now we are setting it ourselves here.
  const darkMode = useDarkMode();

  return (
    <FormFieldContainer>
      <RadioGroup
        data-testid="export-option-filters"
        onChange={handleExportOptionSelect}
        className={optionRadioStyles}
        darkMode={darkMode}
      >
        <Radio value="filter" checked={!isFullCollection}>
          Export query with filters{resultsSummary} (Recommended)
        </Radio>
        <div
          className={cx(
            queryViewerStyles,
            isFullCollection && queryViewerDisabledStyles
          )}
          data-testid="query-viewer-wrapper"
        >
          <Code copyable={false} language="js">
            {codeString}
          </Code>
        </div>
        <Radio
          value="full"
          data-testid="export-full-collection"
          checked={isFullCollection}
        >
          Export Full Collection
        </Radio>
      </RadioGroup>
    </FormFieldContainer>
  );
}

function ExportModalNextButton({
  exportStep,
  fields,
  fileName,
  status,
  handleChangeModalStatus,
  startExport,
}: {
  exportStep: ExportStep;
  fields: Record<string, boolean>;
  fileName: string;
  status: ProcessStatus;
  handleChangeModalStatus: (step: ExportStep) => void;
  startExport: () => void;
}) {
  /**
   * Handle clicking the export button.
   */
  const handleExport = useCallback(() => {
    startExport();
  }, [startExport]);

  const handleRevealClick = useCallback(() => {
    revealFile(fileName);
  }, [fileName]);

  // only show "Show File" Button on the last stage of export modal
  if (status === COMPLETED && exportStep === FILETYPE) {
    return (
      <Button
        data-testid="show-file-button"
        variant="primary"
        onClick={handleRevealClick}
      >
        Show File
      </Button>
    );
  }
  if (exportStep === QUERY) {
    return (
      <Button
        data-testid="select-fields-button"
        variant="primary"
        onClick={() => handleChangeModalStatus(FIELDS)}
      >
        Select Fields
      </Button>
    );
  }
  if (exportStep === FIELDS) {
    // if all fields are unselected disable "Select Output" button
    const emptyFields = Object.entries(fields).length === 0;

    return (
      <Button
        data-testid="select-output-button"
        disabled={emptyFields}
        variant="primary"
        onClick={() => handleChangeModalStatus(FILETYPE)}
      >
        Select Output
      </Button>
    );
  }
  return (
    <Button
      data-testid="export-button"
      onClick={handleExport}
      variant="primary"
      disabled={status === STARTED}
    >
      Export
    </Button>
  );
}

type ExportModalProps = {
  open?: boolean;
  error?: Error | null;
  count: number | null;
  fileType: 'json' | 'csv';
  fileName: string;
  ns: string; // Namespace
  query: ExportQueryType | null;
  status: ProcessStatus;
  fields: Record<string, boolean>;
  exportedDocsCount?: number;
  progress: number;
  startExport: () => void;
  closeExport: () => void;
  cancelExport: () => void;
  exportStep: ExportStep;
  sampleFields: () => void;
  updateSelectedFields: (selectedFields: Record<string, boolean>) => void;
  isFullCollection: boolean;
  changeExportStep: (step: ExportStep) => void;
  toggleFullCollection: () => void;
  selectExportFileType: (fileType: 'csv' | 'json') => void;
  selectExportFileName: (fileName: string) => void;
  isAggregation: boolean;
};

function ExportModal({
  open,
  error,
  count,
  fileType,
  fileName,
  ns,
  query,
  status,
  fields,
  exportedDocsCount,
  progress,
  startExport,
  closeExport,
  cancelExport,
  exportStep,
  sampleFields,
  updateSelectedFields,
  isFullCollection,
  changeExportStep,
  toggleFullCollection,
  selectExportFileType,
  selectExportFileName,
  isAggregation,
}: ExportModalProps) {
  useEffect(() => {
    const onSelectExportFileName = ({ detail }: any) => {
      selectExportFileName(detail);
    };

    // Custom document event handler for e2e tests.
    document.addEventListener('selectExportFileName', onSelectExportFileName);
    return () => {
      document.removeEventListener(
        'selectExportFileName',
        onSelectExportFileName
      );
    };
  }, [selectExportFileName]);

  /**
   * Handle clicking the close button.
   */
  const handleClose = useCallback(() => {
    cancelExport();
    closeExport();
  }, [cancelExport, closeExport]);

  /**
   * Start the next step of exporting: selecting fields
   * @param {String} status: next export status
   */
  const handleChangeModalStatus = useCallback(
    (step: ExportStep) => {
      changeExportStep(step);

      if (step === FIELDS && Object.entries(fields).length === 0) {
        sampleFields();
      }
    },
    [changeExportStep, sampleFields, fields]
  );

  /**
   * Return back in export flow.
   */
  const handleBackButton = useCallback(() => {
    const previousState = exportStep === FILETYPE ? FIELDS : QUERY;
    handleChangeModalStatus(previousState);
  }, [exportStep, handleChangeModalStatus]);

  // Only show 'Close' button on the last stage on export modal when export
  // was completed.
  const closeButtonText =
    status === COMPLETED && exportStep === FILETYPE ? 'Close' : 'Cancel';
  const entityToExport = isAggregation ? 'Aggregation from' : 'Collection';

  useTrackOnChange(
    'COMPASS-IMPORT-EXPORT-UI',
    (track) => {
      if (open) {
        track('Screen', { name: 'export_modal' });
      }
    },
    [open],
    undefined,
    React
  );

  return (
    <Modal open={open} setOpen={handleClose} data-testid="export-modal">
      <ModalHeader title="Export" subtitle={`${entityToExport} ${ns}`} />
      <ModalBody>
        {exportStep === QUERY && (
          <ExportOptions
            count={count}
            ns={ns}
            query={query ?? {}}
            isFullCollection={isFullCollection}
            toggleFullCollection={toggleFullCollection}
          />
        )}
        {exportStep === FIELDS && (
          <ExportSelectFields
            fields={fields}
            updateSelectedFields={updateSelectedFields}
          />
        )}
        <ExportSelectOutput
          count={count}
          status={status}
          fileType={fileType}
          fileName={fileName}
          ns={ns}
          progress={progress}
          exportStep={exportStep}
          startExport={startExport}
          cancelExport={cancelExport}
          exportedDocsCount={exportedDocsCount}
          selectExportFileType={selectExportFileType}
          selectExportFileName={selectExportFileName}
          isAggregation={isAggregation}
        />
        {Boolean(error) && <ErrorBox message={error?.message} />}
      </ModalBody>
      <ModalFooter className={actionContainerStyles}>
        <div className={rightActionStyles}>
          <Button
            data-testid={`${closeButtonText.toLowerCase()}-button`}
            onClick={handleClose}
          >
            {closeButtonText}
          </Button>
          <ExportModalNextButton
            exportStep={exportStep}
            fields={fields}
            fileName={fileName}
            status={status}
            handleChangeModalStatus={handleChangeModalStatus}
            startExport={startExport}
          />
        </div>
        {!isAggregation && exportStep !== QUERY && (
          <Button
            data-testid="back-button"
            onClick={handleBackButton}
            leftGlyph={<Icon glyph="ChevronLeft" />}
          >
            Back
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

/**
 * Map the state of the store to component properties.
 */
const mapStateToProps = (state: RootExportState) => {
  return {
    ns: state.ns,
    error: state.exportData.error,
    query: state.exportData.query,
    open: state.exportData.isOpen,
    status: state.exportData.status,
    fields: state.exportData.fields,
    fileType: state.exportData.fileType,
    fileName: state.exportData.fileName,
    progress: state.exportData.progress,
    exportStep: state.exportData.exportStep,
    isFullCollection: state.exportData.isFullCollection,
    exportedDocsCount: state.exportData.exportedDocsCount,
    // 0 is a valid number of documents, only ignore null or undefined
    count: state.exportData.count ?? null,
    isAggregation: Boolean(state.exportData.aggregation),
  };
};

/**
 * Export the connected component as the default.
 */
export default connect(mapStateToProps, {
  startExport,
  closeExport,
  sampleFields,
  cancelExport,
  updateSelectedFields,
  changeExportStep,
  selectExportFileType,
  selectExportFileName,
  toggleFullCollection,
})(ExportModal);
