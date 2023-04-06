import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Button,
  Icon,
  Label,
  Link,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Modal,
  FormFieldContainer,
  RadioBox,
  RadioBoxGroup,
  css,
  cx,
  spacing,
  Code,
  useDarkMode,
} from '@mongodb-js/compass-components';

import { setExportIsOpen } from '../modules/new-export';
import type { RootState } from '../stores/new-export-store';
import { SelectFileType } from './select-file-type';

type ExportFileTypes = 'json' | 'csv';
type FieldsToExport = 'all-fields' | 'select-fields';

function useExport(): [
  {
    fileType: ExportFileTypes;
    fieldsToExport: FieldsToExport;
  },
  {
    setFileType: (fileType: ExportFileTypes) => void;
    setFieldsToExport: (fieldsToExport: FieldsToExport) => void;
  }
] {
  const [fileType, setFileType] = useState<ExportFileTypes>('json');
  const [fieldsToExport, setFieldsToExport] =
    useState<FieldsToExport>('all-fields');

  return [
    {
      fileType,
      fieldsToExport,
    },
    {
      setFileType,
      setFieldsToExport,
    },
  ];
}

const selectFieldsRadioBoxStyles = css({
  // Keep the label from going to two lines.
  whiteSpace: 'nowrap',
});

const closeButtonStyles = css({
  marginRight: spacing[2],
});

const selectFieldsToExportId = 'select-fields-to-export';
const selectFieldsToExportLabelId = 'select-fields-to-export-label';
function FieldsToExportOptions({
  fieldsToExport,
  setFieldsToExport,
}: {
  fieldsToExport: FieldsToExport;
  setFieldsToExport: (fieldsToExport: FieldsToExport) => void;
}) {
  return (
    <>
      <Label htmlFor={selectFieldsToExportId} id={selectFieldsToExportLabelId}>
        Fields to export
      </Label>
      <RadioBoxGroup
        aria-labelledby={selectFieldsToExportLabelId}
        data-testid="select-file-type"
        id={selectFieldsToExportId}
        onChange={({
          target: { value },
        }: React.ChangeEvent<HTMLInputElement>) =>
          setFieldsToExport(value as FieldsToExport)
        }
      >
        <RadioBox
          data-testid="select-file-type-json"
          value="all-fields"
          checked={fieldsToExport === 'all-fields'}
        >
          All fields
        </RadioBox>
        <RadioBox
          className={selectFieldsRadioBoxStyles}
          data-testid="select-file-type-csv"
          value="select-fields"
          checked={fieldsToExport === 'select-fields'}
        >
          Select fields in table
        </RadioBox>
      </RadioBoxGroup>
    </>
  );
}

type ExportModalProps = {
  ns: string;
  isOpen: boolean;
  setExportIsOpen: (isOpen: boolean) => void;
};

function ExportModal({
  ns,
  isOpen,
  setExportIsOpen,
}: ExportModalProps): JSX.Element {
  // const darkMode = useDarkMode();

  // const isOpen = useExportSelector(selectExportIsOpen);
  // const dispatch = useExportDispatch();

  const [{ fileType, fieldsToExport }, { setFileType, setFieldsToExport }] =
    useExport();

  // useEffect(() => {
  //   function onSelectNamespace(meta: { namespace: string }) {
  //     dispatch({
  //       type: 'update-namespace',
  //       namespace: toNS(meta.namespace),
  //     });
  //   }

  //   globalAppRegistry.on('open-export', ({ namespace }) => {
  //     store.dispatch(setExportIsOpen(namespace));
  //   });

  //   return () => {
  //     globalAppRegistry.removeListener('open-export', onSelectNamespace);
  //   };
  // }, [ isOpen ]);

  const handleClose = useCallback(() => {
    // cancelExport(); // TODO: cancel export
    setExportIsOpen(false);
  }, [setExportIsOpen]);

  // useTrackOnChange(
  //   'COMPASS-IMPORT-EXPORT-UI',
  //   (track) => {
  //     if (isOpen) {
  //       track('Screen', { name: 'export_modal' });
  //     }
  //   },
  //   [isOpen],
  //   undefined,
  //   React
  // );

  return (
    <Modal
      open={isOpen}
      setOpen={handleClose}
      data-testid="export-modal"
      // TODO: Large on the table view?
      // size={fileType === 'csv' ? 'large' : 'small'}
    >
      <ModalHeader title="Export" subtitle={`Collection ${ns}`} />
      <ModalBody>
        <SelectFileType
          fileType={fileType}
          label="Export File Type"
          onSelected={setFileType}
        />
        <FieldsToExportOptions
          fieldsToExport={fieldsToExport}
          setFieldsToExport={setFieldsToExport}
        />
        {fileType === 'csv' && (
          <Banner
          // variant="warning"
          >
            Exporting with CSV may lose type information and is not suitable for
            backing up your data.{' '}
            <Link
              href="https://www.mongodb.com/docs/compass/current/import-export/#export-data-from-a-collection"
              target="_blank"
            >
              Learn more
            </Link>
          </Banner>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          data-testid="export-button"
          onClick={() => alert('start export')}
          // disabled={
          //   !fileName
          // }
          variant="primary"
        >
          Export
        </Button>
        <Button
          className={closeButtonStyles}
          data-testid="cancel-button"
          onClick={handleClose}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

const ConnectedExportModal = connect(
  (state: RootState) => ({
    isOpen: state.export.isOpen,
    ns: state.ns,
  }),
  {
    setExportIsOpen,
  }
)(ExportModal);

export { ConnectedExportModal as ExportModal };
