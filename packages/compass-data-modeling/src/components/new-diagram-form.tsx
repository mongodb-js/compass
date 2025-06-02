import React, { useMemo, useState } from 'react';
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
  ErrorSummary,
  FormFieldContainer,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SelectList,
  spacing,
  SpinLoader,
  Body,
  TextInput,
  SearchInput,
  Combobox,
  ComboboxOption,
} from '@mongodb-js/compass-components';

const footerStyles = css({
  flexDirection: 'row',
  alignItems: 'center',
});

const footerTextStyles = css({ marginRight: 'auto' });

const footerActionsStyles = css({ display: 'flex', gap: spacing[200] });

const formContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

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
  footerText?: React.ReactNode;
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
  footerText,
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
      <ModalFooter className={footerStyles}>
        <Body className={footerTextStyles}>{footerText}</Body>
        <div className={footerActionsStyles}>
          <Button onClick={onPreviousClick} key={`${step}-previous`}>
            {previousLabel}
          </Button>
          <Button
            onClick={onNextClick}
            disabled={isNextDisabled}
            isLoading={isLoading}
            data-testid="new-diagram-confirm-button"
            variant="primary"
            loadingIndicator={<SpinLoader />}
            key={`${step}-next`}
          >
            {nextLabel}
          </Button>
        </div>
      </ModalFooter>
    </>
  );
};

const SelectListStyles = css({
  height: 300,
  overflow: 'scroll',
});

function SelectCollectionsStep({
  collections,
  selectedCollections,
  onCollectionsSelect,
}: {
  collections: string[];
  selectedCollections: string[];
  onCollectionsSelect: (colls: string[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredCollections = useMemo(() => {
    try {
      const regex = new RegExp(searchTerm, 'i');
      return collections.filter((x) => regex.test(x));
    } catch {
      return collections;
    }
  }, [collections, searchTerm]);
  return (
    <FormFieldContainer className={formContainerStyles}>
      <SearchInput
        aria-label="Search collections"
        value={searchTerm}
        data-testid="new-diagram-search-collections"
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
      />
      <SelectList
        className={SelectListStyles}
        items={filteredCollections.map((collName) => {
          return {
            id: collName,
            selected: selectedCollections.includes(collName),
            'data-testid': `new-diagram-collection-checkbox-${collName}`,
          };
        })}
        label={{ displayLabelKey: 'id', name: 'Collection Name' }}
        onChange={(items: { id: string; selected: boolean }[]) => {
          // When a user is searching, less collections are shown to the user
          // and we need to keep existing selected collections selected.
          const currentSelectedItems = selectedCollections.filter(
            (collName) => {
              const item = items.find((x) => x.id === collName);
              // The already selected item was not shown to the user (using search),
              // and we have to keep it selected.
              return item ? item.selected : true;
            }
          );

          const newSelectedItems = items
            .filter((item) => {
              return item.selected;
            })
            .map((item) => {
              return item.id;
            });
          onCollectionsSelect(
            Array.from(new Set([...newSelectedItems, ...currentSelectedItems]))
          );
        }}
      ></SelectList>
    </FormFieldContainer>
  );
}

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
  error: Error | null;

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
  error,
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
  const [activeConnections, otherConnections] = useMemo(() => {
    const active = [];
    const other = [];
    for (const connection of connections) {
      if (connection.status === 'connected') {
        active.push(connection);
      } else {
        other.push(connection);
      }
    }
    return [active, other];
  }, [connections]);
  const {
    title,
    description,
    onConfirmAction,
    confirmActionLabel,
    isConfirmDisabled,
    onCancelAction,
    cancelLabel,
    footerText,
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
          description: `${
            collections.length === 1 ? 'This collection' : 'These collections'
          } will be included in your generated diagram.`,
          onConfirmAction: onCollectionsSelectionConfirm,
          confirmActionLabel: 'Generate',
          isConfirmDisabled:
            !selectedCollections || selectedCollections.length === 0,
          onCancelAction: onDatabaseSelectCancel,
          cancelLabel: 'Back',
          footerText: (
            <>
              <strong>{selectedCollections.length}</strong>/
              <strong>{collections.length}</strong> total{' '}
              {collections.length === 1 ? 'collection' : 'collections'}{' '}
              selected.
            </>
          ),
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
    collections,
  ]);

  const formContent = useMemo(() => {
    switch (currentStep) {
      case 'enter-name':
        return (
          <FormFieldContainer>
            <TextInput
              label="New data model name"
              value={diagramName}
              data-testid="new-diagram-name-input"
              onChange={(e) => {
                onNameChange(e.currentTarget.value);
              }}
            ></TextInput>
          </FormFieldContainer>
        );
      case 'select-connection':
        return (
          <FormFieldContainer className={formContainerStyles}>
            <Combobox
              label=""
              aria-label="Select connection"
              value={selectedConnectionId ?? ''}
              data-testid="new-diagram-connection-selector"
              onChange={(connectionId) => {
                if (connectionId) {
                  onConnectionSelect(connectionId);
                }
              }}
              clearable={false}
              multiselect={false}
              disabled={connections.length === 0}
            >
              {activeConnections.map((connection) => {
                return (
                  <ComboboxOption
                    key={connection.info.id}
                    value={connection.info.id}
                    displayName={connection.title}
                    description="Active"
                  ></ComboboxOption>
                );
              })}
              {otherConnections.map((connection) => {
                return (
                  <ComboboxOption
                    key={connection.info.id}
                    value={connection.info.id}
                    displayName={connection.title}
                  ></ComboboxOption>
                );
              })}
            </Combobox>
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
            <Combobox
              label=""
              aria-label="Select database"
              value={selectedDatabase ?? ''}
              data-testid="new-diagram-database-selector"
              onChange={(databaseName) => {
                if (databaseName) {
                  onDatabaseSelect(databaseName);
                }
              }}
              clearable={false}
              multiselect={false}
            >
              {databases.map((db) => {
                return <ComboboxOption key={db} value={db}></ComboboxOption>;
              })}
            </Combobox>
          </FormFieldContainer>
        );
      case 'select-collections':
        return (
          <SelectCollectionsStep
            collections={collections}
            onCollectionsSelect={onCollectionsSelect}
            selectedCollections={selectedCollections}
          />
        );
    }
  }, [
    activeConnections,
    collections,
    connections.length,
    currentStep,
    databases,
    diagramName,
    onCollectionsSelect,
    onConnectionSelect,
    onDatabaseSelect,
    onNameChange,
    otherConnections,
    selectedCollections,
    selectedConnectionId,
    selectedDatabase,
  ]);

  return (
    <Modal
      open={isModalOpen}
      data-testid="new-diagram-modal"
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
        footerText={footerText}
      >
        {formContent}
        {error && <ErrorSummary errors={[error.message]} />}
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
      error,
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
      error,
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
