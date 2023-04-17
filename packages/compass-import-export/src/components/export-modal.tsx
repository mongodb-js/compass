import React, { useCallback, useState } from 'react';
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
} from '@mongodb-js/compass-components';
import { useTrackOnChange } from '@mongodb-js/compass-logging';

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

type ExportFileTypes = 'json' | 'csv';

function useExport(): [
  {
    fileType: ExportFileTypes;
    fieldsToExportOption: FieldsToExportOption;
  },
  {
    setFileType: (fileType: ExportFileTypes) => void;
    setFieldsToExportOption: (
      fieldsToExportOption: FieldsToExportOption
    ) => void;
  }
] {
  const [fileType, setFileType] = useState<ExportFileTypes>('json');
  const [fieldsToExportOption, setFieldsToExportOption] =
    useState<FieldsToExportOption>('all-fields');

  return [
    {
      fileType,
      fieldsToExportOption,
    },
    {
      setFileType,
      setFieldsToExportOption,
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
  selectedFieldOption: undefined | FieldsToExportOption;
  isFieldsToExportLoading: boolean;
  selectFieldsToExport: () => void;
  readyToExport: (selectedFieldOption?: 'all-fields') => void;
  runExport: () => void;
  backToSelectFieldOptions: () => void;
  backToSelectFieldsToExport: () => void;
  closeExport: () => void;
  status: ExportStatus;
};

function ExportModal({
  ns,
  query,
  aggregation,
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
  const [
    { fileType, fieldsToExportOption },
    { setFileType, setFieldsToExportOption },
  ] = useExport();

  useTrackOnChange(
    'COMPASS-IMPORT-EXPORT-UI',
    (track) => {
      if (isOpen) {
        track('Screen', { name: 'export_modal' });
      }
    },
    [isOpen],
    undefined,
    React
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
            {!aggregation && !exportFullCollection && (
              <>
                <ExportCodeView />
                {query && queryHasProjection(query) && (
                  <Banner>
                    Only projected fields will be exported. To export all
                    fields, go back and leave the <strong>Project</strong> field
                    empty.
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
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {status === 'select-field-options' && (
          <Button onClick={onClickSelectFieldOptionsNext} variant="primary">
            Next
          </Button>
        )}
        {status === 'select-fields-to-export' && (
          <Button
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
            onClick={runExport}
            variant="primary"
          >
            Export…
          </Button>
        )}
        {((status === 'ready-to-export' && !!selectedFieldOption) ||
          status === 'select-fields-to-export') && (
          <Button className={closeButtonStyles} onClick={onClickBack}>
            Back
          </Button>
        )}
        {((status === 'ready-to-export' && !selectedFieldOption) ||
          status === 'select-field-options') && (
          <Button className={closeButtonStyles} onClick={closeExport}>
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
