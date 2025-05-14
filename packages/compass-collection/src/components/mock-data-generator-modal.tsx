import React, { useState } from 'react';

import { Chip, Variant } from '@leafygreen-ui/chip';
import {
  Body,
  css,
  Combobox,
  ComboboxOption,
  Code,
  Checkbox,
  TextInput,
} from '@mongodb-js/compass-components';

import { Size } from '@leafygreen-ui/select';
import {
  Table,
  TableHead,
  HeaderRow,
  HeaderCell,
  TableBody,
  Row,
  Cell,
} from '@leafygreen-ui/table';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ButtonVariant,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { CollectionState } from '../modules/collection-tab';
import { FAKE_SCHEMA_GENERATE_RESPONSE } from '../constants';

const columnStyles = css`
  display: flex;
  gap: 8px;
  flex-direction: row;
  justify-content: space-between;
  margin: 20px 0;
`;

const rowStyles = css`
  display: flex;
  gap: 4px;
  flex-direction: column;
  width: 256px;
`;

const footerStyles = css`
  flex-direction: row;
  justify-content: space-between;
`;

const rightButtonsStyles = css`
  display: flex;
  gap: 8px;
  flex-direction: row;
`;

const comboboxStyles = css`
  width: 500px;
  margin-top: 20px;
`;

const tableStyles = css`
  th:first-of-type,
  td:first-child {
    padding-left: 0;
  }
`;

const MAX_NUMBER_OF_STEPS = 4;
const LAST_STEP = MAX_NUMBER_OF_STEPS - 1;
const DEFAULT_NUMBER_OF_DOCUMENTS = 100;

const MOCK_PREVIEW_DOCS = `
          personDocument = {
            "name": { "first": "Alan", "last": "Turing" },
            "birth": datetime.datetime(1912, 6, 23),
          }

          personDocument = {
            "name": { "first": "Alan", "last": "Turing" },
            "birth": datetime.datetime(1912, 6, 23),
          }

          personDocument = {
            "name": { "first": "Alan", "last": "Turing" },
            "birth": datetime.datetime(1912, 6, 23),
          }

          personDocument = {
            "name": { "first": "Alan", "last": "Turing" },
            "birth": datetime.datetime(1912, 6, 23),
          }

          personDocument = {
            "name": { "first": "Alan", "last": "Turing" },
            "birth": datetime.datetime(1912, 6, 23),
          }`;

type MockDataGeneratorModalState = {
  collections: Array<string>;
};

const SchemaViewStep = () => {
  return (
    <div>
      {FAKE_SCHEMA_GENERATE_RESPONSE.collections.map((collection) => {
        return (
          <div key={collection.name}>
            <Chip variant={Variant.Gray} label={collection.name}>
              {collection.name}
            </Chip>

            <Table className={tableStyles}>
              <TableHead>
                <HeaderRow>
                  <HeaderCell>Field Name</HeaderCell>
                  <HeaderCell>MongoDB Data Type</HeaderCell>
                  <HeaderCell>faker-js module</HeaderCell>
                  <HeaderCell>faker-js module args</HeaderCell>
                </HeaderRow>
              </TableHead>
              <TableBody>
                {Object.keys(collection.schema).map((fieldName) => {
                  const metadata = collection.schema[fieldName];
                  return (
                    <Row>
                      <Cell>{fieldName}</Cell>
                      <Cell>{metadata.type}</Cell>
                      <Cell>{metadata.faker}</Cell>
                      <Cell>
                        {metadata.fakerArgs
                          ?.map((arg) => JSON.stringify(arg))
                          .join(', ')}
                      </Cell>
                    </Row>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );
      })}
      )
    </div>
  );
};

const ConfirmNumberOfDocumentsStep = ({
  numberOfDocuments,
  setNumberOfDocuments,
}: {
  numberOfDocuments: number;
  setNumberOfDocuments: (numberOfDocuments: number) => void;
}) => {
  return (
    <div className={rowStyles}>
      <TextInput
        label=" Documents to generate in current collection"
        id="number-of-documents"
        aria-label="number-of-documents"
        type="number"
        min="1"
        value={`${numberOfDocuments}`}
        onChange={(e) => setNumberOfDocuments(Number.parseInt(e.target.value))}
      />
    </div>
  );
};

const SelectCollectionsStep = ({
  collections,
  selectedRelatedCollections,
  onCollectionSelect,
}: {
  collections: Array<string>;
  selectedRelatedCollections: Array<string>;
  onCollectionSelect: (selectedCollection: Array<string>) => void;
}) => {
  return (
    <div className={comboboxStyles}>
      <Combobox
        data-testid="generate-mock-data-combobox"
        clearable={true}
        multiselect={true}
        label="Related Collections (Optional)"
        searchEmptyMessage="No collection found"
        onChange={onCollectionSelect}
        value={selectedRelatedCollections}
        size={Size.Small}
      >
        {collections.map((collection) => {
          return (
            <ComboboxOption key={collection} value={collection}>
              {collection}
            </ComboboxOption>
          );
        })}
      </Combobox>
    </div>
  );
};

const DataPreviewStep = ({
  isAiWarningChecked,
  setIsAiWarningChecked,
}: {
  isAiWarningChecked: boolean;
  setIsAiWarningChecked: (isAiWarningChecked: boolean) => void;
}) => {
  return (
    <div>
      <Code
        id="mock-data-preview"
        data-testid="mock-data-preview"
        language="json"
        copyable={false}
      >
        {/* TODO: prettify */}
        {MOCK_PREVIEW_DOCS}
      </Code>

      <div
        className={css`
          margin-top: 10px;
        `}
      >
        <Checkbox
          data-testid="ai-warning-checkbox"
          id="ai-warning-checkbox"
          label="AI Warning"
          onChange={() => setIsAiWarningChecked(!isAiWarningChecked)}
          checked={isAiWarningChecked}
          description="Check this because you understand that this is using AI and so data
          blah blah blah blah robots are coming just be aware!!!!"
        />
      </div>
    </div>
  );
};

const getPrimaryButtonText = (currentStep: number) => {
  switch (currentStep) {
    case 0:
    case 1:
      return 'Next';
    case 2:
      return 'Preview';
    case 3:
      return 'Insert Mock Data';
    default:
      return '';
  }
};

const MockDataGeneratorModal: React.FunctionComponent<
  MockDataGeneratorModalState & {
    modalOpen: boolean;
    onModalClose: () => void;
    dbName: string;
    collName: string;
  }
> = ({ modalOpen, onModalClose, dbName, collName, collections }) => {
  const [selectedRelatedCollections, setSelectedRelatedCollections] = useState<
    Array<string>
  >([]);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedNumberOfDocuments, setSelectedNumberOfDocuments] =
    useState<number>(DEFAULT_NUMBER_OF_DOCUMENTS);
  const [isAiWarningChecked, setIsAiWarningChecked] = useState<boolean>(false);

  if (!modalOpen) {
    return null;
  }

  const onCollectionSelect = (selectedCollection: Array<string>) => {
    setSelectedRelatedCollections(selectedCollection);
  };

  const onPrimaryButtonClick = () => {
    if (currentStep === LAST_STEP) {
      // TODO - insert mock data
      console.log('Inserting mock data');
      onModalClose();
      return;
    }
    if (currentStep < LAST_STEP) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onBackButtonClick = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Modal
      open={modalOpen}
      setOpen={onModalClose}
      data-testid="generate-mock-data-modal"
    >
      <ModalHeader title="Generate Mock Data" />
      <ModalBody>
        {currentStep !== LAST_STEP && (
          <div className={columnStyles}>
            <div className={rowStyles}>
              <Body weight="medium">Database</Body>
              <Chip variant={Variant.Gray} label={dbName}>
                {dbName}
              </Chip>
            </div>

            <div className={rowStyles}>
              <Body weight="medium">Collection</Body>
              <Chip variant={Variant.Gray} label={collName}>
                {collName}
              </Chip>
            </div>
          </div>
        )}
        {currentStep === 0 && (
          <SelectCollectionsStep
            collections={collections}
            selectedRelatedCollections={selectedRelatedCollections}
            onCollectionSelect={onCollectionSelect}
          />
        )}
        {currentStep === 1 && <SchemaViewStep />}
        {currentStep === 2 && (
          <ConfirmNumberOfDocumentsStep
            numberOfDocuments={selectedNumberOfDocuments}
            setNumberOfDocuments={setSelectedNumberOfDocuments}
          />
        )}
        {currentStep === 3 && (
          <DataPreviewStep
            isAiWarningChecked={isAiWarningChecked}
            setIsAiWarningChecked={setIsAiWarningChecked}
          />
        )}
      </ModalBody>

      <ModalFooter className={footerStyles}>
        <Button onClick={onBackButtonClick}>Back</Button>
        <div className={rightButtonsStyles}>
          <Button onClick={onModalClose}>Cancel</Button>
          <Button
            disabled={currentStep === 3 && !isAiWarningChecked}
            variant={ButtonVariant.Primary}
            onClick={onPrimaryButtonClick}
          >
            {getPrimaryButtonText(currentStep)}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

const mapStateToProps = (state: CollectionState) => ({
  collections: state.collections,
});

const MappedExportToLanguageModal = connect(
  mapStateToProps,
  {}
)(MockDataGeneratorModal);

export default MappedExportToLanguageModal;
