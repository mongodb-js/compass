import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Button,
  Link,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Modal,
  css,
  spacing,
  createElectronFileInputBackend,
} from '@mongodb-js/compass-components';
import { useTrackOnChange } from '@mongodb-js/compass-logging/provider';

import {
  closeExport,
  selectFieldsToExport,
  backToSelectFieldOptions,
  backToSelectFieldsToExport,
  readyToExport,
  runExport,
} from '../modules/export';
import type { ExportStatus, FieldsToExportOption } from '../modules/export';
import type { RootExportState } from '../stores/export-store';
import { SelectFileType } from './select-file-type';
import { ExportSelectFields } from './export-select-fields';
import { ExportCodeView } from './export-code-view';
import type { ExportAggregation, ExportQuery } from '../export/export-types';
import { queryHasProjection } from '../utils/query-has-projection';
import { FieldsToExportOptions } from './export-field-options';
import type { ExportJSONFormat } from '../export/export-json';
import { JSONFileTypeOptions } from './export-json-format-options';

type ExportFileTypes = 'json' | 'csv';

function useExport(): [
  {
    fileType: ExportFileTypes;
    fieldsToExportOption: FieldsToExportOption;
    jsonFormatVariant: ExportJSONFormat;
  },
  {
    setFileType: (fileType: ExportFileTypes) => void;
    setFieldsToExportOption: (
      fieldsToExportOption: FieldsToExportOption
    ) => void;
    setJSONFormatVariant: (jsonFormatVariant: ExportJSONFormat) => void;
    resetExportFormState: () => void;
  }
] {
  const [fileType, setFileType] = useState<ExportFileTypes>('json');
  const [fieldsToExportOption, setFieldsToExportOption] =
    useState<FieldsToExportOption>('all-fields');
  const [jsonFormatVariant, setJSONFormatVariant] =
    useState<ExportJSONFormat>('default');

  const resetExportFormState = useCallback(() => {
    setFileType('json');
    setFieldsToExportOption('all-fields');
    setJSONFormatVariant('default');
  }, []);

  return [
    {
      fileType,
      fieldsToExportOption,
      jsonFormatVariant,
    },
    {
      setFileType,
      setFieldsToExportOption,
      setJSONFormatVariant,
      resetExportFormState,
    },
  ];
}

const closeButtonStyles = css({
  marginRight: spacing[2],
});

const messageBannerStyles = css({
  marginTop: spacing[3],
});

const modalBodyStyles = css({
  paddingTop: spacing[3],
});

type ExportModalProps = {
  ns: string;
  isOpen: boolean;
  query?: ExportQuery;
  exportFullCollection?: boolean;
  aggregation?: ExportAggregation;
  selectedFieldOption: FieldsToExportOption;
  isFieldsToExportLoading: boolean;
  selectFieldsToExport: () => void;
  readyToExport: (selectedFieldOption?: 'all-fields') => void;
  runExport: (exportOptions: {
    filePath: string;
    fileType: 'csv' | 'json';
    jsonFormatVariant: ExportJSONFormat;
  }) => void;
  backToSelectFieldOptions: () => void;
  backToSelectFieldsToExport: () => void;
  closeExport: () => void;
  status: ExportStatus;
  exportFileError: string | undefined;
};

function ExportModal({
  ns,
  query,
  aggregation,
  exportFileError,
  exportFullCollection,
  isFieldsToExportLoading,
  selectedFieldOption,
  selectFieldsToExport,
  readyToExport,
  runExport,
  isOpen,
  closeExport,
  status,
  backToSelectFieldOptions,
  backToSelectFieldsToExport,
}: ExportModalProps) {
  // TODO: this state depends on redux store too much and should be part of
  // redux store and not UI
  const [
    { fileType, jsonFormatVariant, fieldsToExportOption },
    {
      setFileType,
      setJSONFormatVariant,
      setFieldsToExportOption,
      resetExportFormState,
    },
  ] = useExport();

  useTrackOnChange(
    'COMPASS-IMPORT-EXPORT-UI',
    (track) => {
      if (isOpen) {
        track('Screen', { name: 'export_modal' });
      }
    },
    [isOpen],
    undefined
  );

  const onClickBack = useCallback(() => {
    if (status === 'ready-to-export' && selectedFieldOption !== 'all-fields') {
      backToSelectFieldsToExport();
      return;
    }
    backToSelectFieldOptions();
  }, [
    status,
    backToSelectFieldOptions,
    selectedFieldOption,
    backToSelectFieldsToExport,
  ]);

  const onClickSelectFieldOptionsNext = useCallback(() => {
    if (fieldsToExportOption === 'all-fields') {
      readyToExport('all-fields');
      return;
    }
    selectFieldsToExport();
  }, [readyToExport, selectFieldsToExport, fieldsToExportOption]);

  const onSelectExportFilePath = useCallback(
    (filePath: string) => {
      runExport({
        filePath,
        fileType,
        jsonFormatVariant,
      });
    },
    [runExport, fileType, jsonFormatVariant]
  );

  const onClickExport = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports, @typescript-eslint/no-var-requires
    const electron: typeof import('@electron/remote') = require('@electron/remote');
    const fileBackend = createElectronFileInputBackend(electron)();

    fileBackend.onFilesChosen((files: string[]) => {
      if (files.length > 0) {
        onSelectExportFilePath(files[0]);
      }
    });

    fileBackend.openFileChooser({
      multi: false,
      mode: 'save',
      title: 'Target output file',
      defaultPath: `${ns}.${fileType}`,
      buttonLabel: 'Select',
      filters: [
        { name: fileType, extensions: [fileType] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
  }, [fileType, ns, onSelectExportFilePath]);

  const onSelectExportFileNameEvent = useCallback(
    ({ detail: filePath }: CustomEventInit<string>) => {
      onSelectExportFilePath(filePath!);
    },
    [onSelectExportFilePath]
  );

  useEffect(() => {
    if (isOpen) {
      // For e2e testing we can't set the value of a file output
      // for security reasons, so we listen to a dom event that sets it.
      // https://github.com/electron-userland/spectron/issues/23
      document.addEventListener(
        'selectExportFileName',
        onSelectExportFileNameEvent
      );
      return () => {
        document.removeEventListener(
          'selectExportFileName',
          onSelectExportFileNameEvent
        );
      };
    }
  }, [isOpen, onSelectExportFileNameEvent]);

  useLayoutEffect(() => {
    if (isOpen) {
      resetExportFormState();
    }
  }, [isOpen, resetExportFormState]);

  return (
    <Modal open={isOpen} setOpen={closeExport} data-testid="export-modal">
      <ModalHeader
        title="Export"
        subtitle={aggregation ? `Aggregation on ${ns}` : `Collection ${ns}`}
      />
      <ModalBody className={modalBodyStyles}>
        {status === 'select-field-options' && (
          <>
            {!exportFullCollection && !aggregation && <ExportCodeView />}
            <FieldsToExportOptions
              fieldsToExportOption={fieldsToExportOption}
              setFieldsToExportOption={setFieldsToExportOption}
            />
          </>
        )}
        {status === 'select-fields-to-export' && <ExportSelectFields />}
        {status === 'ready-to-export' && (
          <>
            {!exportFullCollection && (
              <>
                <ExportCodeView />
                {!aggregation && query && queryHasProjection(query) && (
                  <Banner data-testid="export-projection-banner">
                    Only projected fields will be exported. To export all
                    fields, go back and leave the <b>Project</b> field empty.
                  </Banner>
                )}
              </>
            )}
            <SelectFileType
              fileType={fileType}
              label="Export File Type"
              onSelected={setFileType}
            />
            {fileType === 'csv' && (
              <Banner className={messageBannerStyles}>
                Exporting with CSV may lose type information and is not suitable
                for backing up your data.{' '}
                <Link
                  href="https://www.mongodb.com/docs/compass/current/import-export/#export-data-from-a-collection"
                  target="_blank"
                >
                  Learn more
                </Link>
              </Banner>
            )}
            {fileType === 'json' && (
              <JSONFileTypeOptions
                jsonFormat={jsonFormatVariant}
                setJSONFormatVariant={setJSONFormatVariant}
              />
            )}
            {exportFileError && (
              <Banner variant="danger" className={messageBannerStyles}>
                Error creating output file: {exportFileError}
              </Banner>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {status === 'select-field-options' && (
          <Button
            data-testid="export-next-step-button"
            onClick={onClickSelectFieldOptionsNext}
            variant="primary"
          >
            Next
          </Button>
        )}
        {status === 'select-fields-to-export' && (
          <Button
            data-testid="export-next-step-button"
            onClick={() => readyToExport()}
            disabled={isFieldsToExportLoading}
            variant="primary"
          >
            Next
          </Button>
        )}

        {status === 'ready-to-export' && (
          <Button
            data-testid="export-button"
            onClick={onClickExport}
            variant="primary"
          >
            Export…
          </Button>
        )}
        {((status === 'ready-to-export' &&
          !exportFullCollection &&
          !aggregation &&
          !(query && queryHasProjection(query))) ||
          status === 'select-fields-to-export') && (
          <Button className={closeButtonStyles} onClick={onClickBack}>
            Back
          </Button>
        )}
        {((status === 'ready-to-export' &&
          (aggregation ||
            exportFullCollection ||
            (query && queryHasProjection(query)))) ||
          status === 'select-field-options') && (
          <Button
            data-testid="export-close-export-button"
            className={closeButtonStyles}
            onClick={closeExport}
          >
            Cancel
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

const ConnectedExportModal = connect(
  (state: RootExportState) => ({
    isOpen: state.export.isOpen,
    ns: state.export.namespace,
    query: state.export.query,
    aggregation: state.export.aggregation,
    exportFullCollection: state.export.exportFullCollection,
    isFieldsToExportLoading: !!state.export.fieldsToExportAbortController,
    status: state.export.status,
    selectedFieldOption: state.export.selectedFieldOption,
    exportFileError: state.export.exportFileError,
  }),
  {
    closeExport,
    selectFieldsToExport,
    backToSelectFieldOptions,
    backToSelectFieldsToExport,
    readyToExport,
    runExport,
  }
)(ExportModal);

export {
  ConnectedExportModal as ExportModal,
  ExportModal as UnconnectedExportModal,
};
