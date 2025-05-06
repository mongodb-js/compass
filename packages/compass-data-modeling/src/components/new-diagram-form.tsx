import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { useConnectionsList } from '@mongodb-js/compass-connections/provider';
import type { GenerateDiagramWizardState } from '../store/generate-diagram-wizard';
import {
  cancelConfirmName,
  cancelCreateNewDiagram,
  cancelSelectedConnection,
  cancelSelectedDatabase,
  changeName,
  confirmName,
  confirmSelectConnection,
  confirmSelectDatabase,
  confirmSelectedCollections,
  selectCollections,
  selectConnection,
  selectDatabase,
} from '../store/generate-diagram-wizard';
import {
  Banner,
  Button,
  css,
  FormFieldContainer,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Option,
  Select,
  SelectList,
  TextInput,
} from '@mongodb-js/compass-components';

const FormStepContainer: React.FunctionComponent<{
  title: string;
  description?: string;
  onNextClick: () => void;
  onPreviousClick: () => void;
  isLoading: boolean;
  isNextDisabled: boolean;
  nextLabel: string;
  previousLabel: string;
  step: string;
}> = ({
  title,
  description,
  onPreviousClick,
  onNextClick,
  isLoading,
  isNextDisabled,
  nextLabel,
  previousLabel,
  children,
  step,
}) => {
  return (
    <>
      <ModalHeader title={title} subtitle={description}></ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onNextClick();
          }}
        >
          {children}
        </form>
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={onNextClick}
          disabled={isNextDisabled}
          isLoading={isLoading}
          variant="primary"
          key={`${step}-next`}
        >
          {nextLabel}
        </Button>
        <Button onClick={onPreviousClick} key={`${step}-previous`}>
          {previousLabel}
        </Button>
      </ModalFooter>
    </>
  );
};

const SelectListStyles = css({
  maxHeight: 300,
});

type NewDiagramFormProps = {
  isModalOpen: boolean;
  formStep:
    | 'enter-name'
    | 'select-connection'
    | 'select-database'
    | 'select-collections';
  isLoading: boolean;
  diagramName: string;
  selectedConnectionId: string | null;
  databases: string[];
  selectedDatabase: string | null;
  collections: string[];
  selectedCollections: string[];

  onCancel: () => void;
  onNameChange: (name: string) => void;
  onNameConfirm: () => void;
  onNameConfirmCancel: () => void;
  onConnectionSelect: (connectionId: string) => void;
  onConnectionSelectCancel: () => void;
  onConnectionConfirmSelection: () => void;
  onDatabaseSelect: (database: string) => void;
  onDatabaseSelectCancel: () => void;
  onDatabaseConfirmSelection: () => void;
  onCollectionsSelect: (collections: string[]) => void;
  onCollectionsSelectionConfirm: () => void;
};

const NewDiagramForm: React.FunctionComponent<NewDiagramFormProps> = ({
  isModalOpen,
  formStep: currentStep,
  isLoading,
  diagramName,
  selectedConnectionId,
  databases,
  selectedDatabase,
  collections,
  selectedCollections,
  onCancel,
  onNameChange,
  onNameConfirm,
  onNameConfirmCancel,
  onConnectionSelect,
  onConnectionSelectCancel,
  onConnectionConfirmSelection,
  onDatabaseSelect,
  onDatabaseSelectCancel,
  onDatabaseConfirmSelection,
  onCollectionsSelect,
  onCollectionsSelectionConfirm,
}) => {
  const connections = useConnectionsList();
  const {
    title,
    description,
    onConfirmAction,
    confirmActionLabel,
    isConfirmDisabled,
    onCancelAction,
    cancelLabel,
  } = useMemo(() => {
    switch (currentStep) {
      case 'enter-name':
        return {
          title: 'Name your diagram',
          onConfirmAction: onNameConfirm,
          confirmActionLabel: 'Next',
          isConfirmDisabled: !diagramName,
          onCancelAction: onCancel,
          cancelLabel: 'Cancel',
        };
      case 'select-connection':
        return {
          title: 'Select connection',
          onConfirmAction: onConnectionConfirmSelection,
          confirmActionLabel: 'Next',
          isConfirmDisabled: !selectedConnectionId,
          onCancelAction: onNameConfirmCancel,
          cancelLabel: 'Back',
        };
      case 'select-database':
        return {
          title: 'Select database',
          onConfirmAction: onDatabaseConfirmSelection,
          confirmActionLabel: 'Next',
          isConfirmDisabled: !selectedDatabase,
          onCancelAction: onConnectionSelectCancel,
          cancelLabel: 'Back',
        };
      case 'select-collections':
        return {
          title: `Select collections for ${selectedDatabase ?? ''}`,
          description:
            'These collections will be included to the generated diagram',
          onConfirmAction: onCollectionsSelectionConfirm,
          confirmActionLabel: 'Generate',
          isConfirmDisabled:
            !selectedCollections || selectCollections.length === 0,
          onCancelAction: onDatabaseSelectCancel,
          cancelLabel: 'Back',
        };
    }
  }, [
    currentStep,
    diagramName,
    onCancel,
    onCollectionsSelectionConfirm,
    onConnectionConfirmSelection,
    onConnectionSelectCancel,
    onDatabaseConfirmSelection,
    onDatabaseSelectCancel,
    onNameConfirm,
    onNameConfirmCancel,
    selectedCollections,
    selectedConnectionId,
    selectedDatabase,
  ]);

  const formContent = useMemo(() => {
    switch (currentStep) {
      case 'enter-name':
        return (
          <FormFieldContainer>
            <TextInput
              label="New data model name"
              value={diagramName}
              onChange={(e) => {
                onNameChange(e.currentTarget.value);
              }}
            ></TextInput>
          </FormFieldContainer>
        );
      case 'select-connection':
        return (
          <FormFieldContainer>
            <Select
              label=""
              value={selectedConnectionId ?? ''}
              onChange={onConnectionSelect}
              disabled={connections.length === 0}
            >
              {connections.map((connection) => {
                return (
                  <Option key={connection.info.id} value={connection.info.id}>
                    {connection.title}
                  </Option>
                );
              })}
            </Select>
            {connections.length === 0 && (
              <Banner variant="warning">
                You do not have any connections, create a new connection first
              </Banner>
            )}
          </FormFieldContainer>
        );
      case 'select-database':
        return (
          <FormFieldContainer>
            <Select
              label=""
              value={selectedDatabase ?? ''}
              onChange={onDatabaseSelect}
            >
              {databases.map((db) => {
                return (
                  <Option key={db} value={db}>
                    {db}
                  </Option>
                );
              })}
            </Select>
          </FormFieldContainer>
        );
      case 'select-collections':
        return (
          <FormFieldContainer>
            <SelectList
              className={SelectListStyles}
              items={collections.map((collName) => {
                return {
                  id: collName,
                  selected: selectedCollections.includes(collName),
                };
              })}
              label={['id', 'Collection Name']}
              onChange={(items) => {
                const selectedItems = items
                  .filter((item) => {
                    return item.selected;
                  })
                  .map((item) => {
                    return item.id;
                  });
                onCollectionsSelect(selectedItems);
              }}
            ></SelectList>
          </FormFieldContainer>
        );
    }
  }, [
    collections,
    connections,
    currentStep,
    databases,
    diagramName,
    onCollectionsSelect,
    onConnectionSelect,
    onDatabaseSelect,
    onNameChange,
    selectedCollections,
    selectedConnectionId,
    selectedDatabase,
  ]);

  return (
    <Modal
      open={isModalOpen}
      setOpen={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <FormStepContainer
        title={title}
        description={description}
        onNextClick={onConfirmAction}
        onPreviousClick={onCancelAction}
        nextLabel={confirmActionLabel}
        previousLabel={cancelLabel}
        isNextDisabled={isConfirmDisabled}
        isLoading={isLoading}
        step={currentStep}
      >
        {formContent}
      </FormStepContainer>
    </Modal>
  );
};

function mapWizardStateToFormStep(
  step: GenerateDiagramWizardState['step']
): NewDiagramFormProps['formStep'] {
  switch (step) {
    case 'ENTER_NAME':
      return 'enter-name';
    case 'SELECT_CONNECTION':
    case 'CONNECTING':
    case 'LOADING_DATABASES':
      return 'select-connection';
    case 'SELECT_DATABASE':
    case 'LOADING_COLLECTIONS':
      return 'select-database';
    case 'SELECT_COLLECTIONS':
      return 'select-collections';
  }
}

export default connect(
  (state: DataModelingState) => {
    const {
      inProgress,
      step,
      diagramName,
      selectedConnectionId,
      connectionDatabases,
      selectedDatabase,
      databaseCollections,
      selectedCollections,
    } = state.generateDiagramWizard;
    return {
      isModalOpen: inProgress,
      formStep: mapWizardStateToFormStep(step),
      isLoading: [
        'CONNECTING',
        'LOADING_DATABASES',
        'LOADING_COLLECTIONS',
      ].includes(step),
      diagramName,
      selectedConnectionId,
      databases: connectionDatabases ?? [],
      selectedDatabase,
      collections: databaseCollections ?? [],
      selectedCollections: selectedCollections ?? [],
    };
  },
  {
    onCancel: cancelCreateNewDiagram,
    onNameChange: changeName,
    onNameConfirm: confirmName,
    onNameConfirmCancel: cancelConfirmName,
    onConnectionSelect: selectConnection,
    onConnectionSelectCancel: cancelSelectedConnection,
    onConnectionConfirmSelection: confirmSelectConnection,
    onDatabaseSelect: selectDatabase,
    onDatabaseSelectCancel: cancelSelectedDatabase,
    onDatabaseConfirmSelection: confirmSelectDatabase,
    onCollectionsSelect: selectCollections,
    onCollectionsSelectionConfirm: confirmSelectedCollections,
  }
)(NewDiagramForm);
