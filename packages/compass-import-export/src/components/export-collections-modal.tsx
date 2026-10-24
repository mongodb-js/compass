import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  Button,
  Checkbox,
  Link,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SpinLoader,
  createElectronFileInputBackend,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import {
  closeExportCollections,
  runExportCollections,
  toggleAllCollections,
  toggleCollection,
} from '../modules/export-collections';
import type {
  ExportCollectionsStatus,
  ExportableCollection,
} from '../modules/export-collections';
import type { RootExportState } from '../stores/export-store';
import type { ExportJSONFormat } from '../export/export-json';
import { JSONFileTypeOptions } from './export-json-format-options';
import { SelectFileType } from './select-file-type';
import { AdvancedCSVFormat } from './export-modal';

type ExportFileType = 'json' | 'csv';

const csvBannerStyles = css({
  marginTop: spacing[400],
});

const collectionListStyles = css({
  maxHeight: 280,
  overflowY: 'auto',
  margin: `${spacing[200]}px 0 ${spacing[400]}px`,
  paddingLeft: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const loaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const footerStyles = css({
  display: 'flex',
  gap: spacing[200],
});

function formatCount(count: number | undefined) {
  return count === undefined
    ? ''
    : ` (${count} document${count !== 1 ? 's' : ''})`;
}

type ExportCollectionsModalProps = {
  isOpen: boolean;
  databaseName: string;
  status: ExportCollectionsStatus;
  collections: ExportableCollection[];
  selectedCollections: string[];
  errorLoadingCollections: string | undefined;
  closeExportCollections: () => void;
  toggleCollection: (collectionName: string) => void;
  toggleAllCollections: () => void;
  runExportCollections: (options: {
    directoryPath: string;
    fileType: ExportFileType;
    jsonFormatVariant: ExportJSONFormat;
    escapeFormulae: boolean;
    includeMetadata: boolean;
  }) => void;
};

function ExportCollectionsModal({
  isOpen,
  databaseName,
  status,
  collections,
  selectedCollections,
  errorLoadingCollections,
  closeExportCollections,
  toggleCollection,
  toggleAllCollections,
  runExportCollections,
}: ExportCollectionsModalProps) {
  // Kept between openings so the last chosen options are remembered.
  const [fileType, setFileType] = useState<ExportFileType>('json');
  const [jsonFormatVariant, setJSONFormatVariant] =
    useState<ExportJSONFormat>('default');
  const [escapeFormulae, setEscapeFormulae] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const selectableCount = collections.filter((c) => !c.isView).length;

  const onSelectDirectory = useCallback(
    (directoryPath: string) => {
      runExportCollections({
        directoryPath,
        fileType,
        jsonFormatVariant,
        escapeFormulae,
        includeMetadata,
      });
    },
    [
      runExportCollections,
      fileType,
      jsonFormatVariant,
      escapeFormulae,
      includeMetadata,
    ]
  );

  const onClickExport = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports, @typescript-eslint/no-require-imports
    const electron: typeof import('@electron/remote') = require('@electron/remote');
    const fileBackend = createElectronFileInputBackend(electron, null)();

    fileBackend.onFilesChosen((files: string[]) => {
      if (files.length > 0) {
        onSelectDirectory(files[0]);
      }
    });

    fileBackend.openFileChooser({
      multi: false,
      mode: 'open',
      title: 'Target output folder',
      buttonLabel: 'Export here',
      properties: ['openDirectory', 'createDirectory'],
    });
  }, [onSelectDirectory]);

  const onSelectDirectoryEvent = useCallback(
    ({ detail: directoryPath }: CustomEventInit<string>) => {
      onSelectDirectory(directoryPath!);
    },
    [onSelectDirectory]
  );

  useEffect(() => {
    if (isOpen) {
      // For e2e testing we can't drive the native folder picker, so we listen
      // to a dom event that sets the output folder instead.
      document.addEventListener(
        'selectExportCollectionsDirectory',
        onSelectDirectoryEvent
      );
      return () => {
        document.removeEventListener(
          'selectExportCollectionsDirectory',
          onSelectDirectoryEvent
        );
      };
    }
  }, [isOpen, onSelectDirectoryEvent]);

  return (
    <Modal
      open={isOpen}
      setOpen={closeExportCollections}
      data-testid="export-collections-modal"
    >
      <ModalHeader
        title="Export collections"
        subtitle={`Database ${databaseName}`}
      />
      <ModalBody>
        {status === 'loading-collections' && (
          <div className={loaderStyles}>
            <SpinLoader />
            <Body>Loading collections…</Body>
          </div>
        )}
        {errorLoadingCollections && (
          <Banner variant="danger">
            Unable to load collections: {errorLoadingCollections}
          </Banner>
        )}
        {status === 'select-collections' && !errorLoadingCollections && (
          <>
            {collections.length === 0 ? (
              <Body>This database has no collections.</Body>
            ) : (
              <>
                <Checkbox
                  data-testid="export-collections-select-all"
                  label="Select all"
                  checked={
                    selectableCount > 0 &&
                    selectedCollections.length === selectableCount
                  }
                  indeterminate={
                    selectedCollections.length > 0 &&
                    selectedCollections.length < selectableCount
                  }
                  onChange={toggleAllCollections}
                />
                <div className={collectionListStyles}>
                  {collections.map(({ name, isView, count }) => (
                    <Checkbox
                      key={name}
                      data-testid={`export-collections-item-${name}`}
                      label={`${name}${formatCount(count)}`}
                      description={
                        isView ? 'Views are not exported.' : undefined
                      }
                      disabled={isView}
                      checked={selectedCollections.includes(name)}
                      onChange={() => toggleCollection(name)}
                    />
                  ))}
                </div>
                <Checkbox
                  data-testid="export-collections-include-metadata"
                  label="Include indexes and collection options"
                  description={`Writes a <collection>.metadata.json file next to each <collection>.${fileType} file.`}
                  checked={includeMetadata}
                  onChange={(event) => setIncludeMetadata(event.target.checked)}
                />
                <SelectFileType
                  fileType={fileType}
                  label="Export File Type"
                  onSelected={setFileType}
                />
                {fileType === 'csv' && (
                  <>
                    <AdvancedCSVFormat
                      escapeFormulae={escapeFormulae}
                      onEscapeFormulaeChange={setEscapeFormulae}
                    />
                    <Banner className={csvBannerStyles}>
                      Every field of each collection is exported. CSV may lose
                      type information and is not suitable for backing up your
                      data.{' '}
                      <Link
                        href="https://www.mongodb.com/docs/compass/current/import-export/#export-data-from-a-collection"
                        target="_blank"
                      >
                        Learn more
                      </Link>
                    </Banner>
                  </>
                )}
                {fileType === 'json' && (
                  <JSONFileTypeOptions
                    jsonFormat={jsonFormatVariant}
                    setJSONFormatVariant={setJSONFormatVariant}
                  />
                )}
              </>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          data-testid="export-collections-cancel-button"
          onClick={closeExportCollections}
        >
          Cancel
        </Button>
        <Button
          data-testid="export-collections-export-button"
          variant="primary"
          disabled={
            status !== 'select-collections' || selectedCollections.length === 0
          }
          onClick={onClickExport}
        >
          {selectedCollections.length > 0
            ? `Export ${selectedCollections.length} collection${
                selectedCollections.length !== 1 ? 's' : ''
              }…`
            : 'Export…'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

const ConnectedExportCollectionsModal = connect(
  (state: RootExportState) => ({
    isOpen: state.exportCollections.isOpen,
    databaseName: state.exportCollections.databaseName,
    status: state.exportCollections.status,
    collections: state.exportCollections.collections,
    selectedCollections: state.exportCollections.selectedCollections,
    errorLoadingCollections: state.exportCollections.errorLoadingCollections,
  }),
  {
    closeExportCollections,
    toggleCollection,
    toggleAllCollections,
    runExportCollections,
  }
)(ExportCollectionsModal);

export {
  ConnectedExportCollectionsModal as ExportCollectionsModal,
  ExportCollectionsModal as UnconnectedExportCollectionsModal,
};
