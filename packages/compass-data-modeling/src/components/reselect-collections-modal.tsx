import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import {
  Combobox,
  ComboboxOption,
  Modal,
} from '@mongodb-js/compass-components';
import { selectIsAnalysisInProgress } from '../store/analysis-process';
import type { ReselectCollectionsWizardState } from '../store/reselect-collections-wizard';
import {
  selectCollections,
  toggleInferRelationships,
  hideReselectCollections,
  establishConnection,
  selectConnection,
  startRedoAnalysis,
  changeSamplingOptions,
} from '../store/reselect-collections-wizard';
import { SelectCollectionsList } from './select-collections-list';
import { useSavedConnections } from '../utils/use-saved-connections';
import { ModalStepContainer } from './model-step-container';

const SelectCollectionsStep = connect(
  (state: DataModelingState) => {
    const {
      databaseCollections,
      selectedCollections,
      error,
      automaticallyInferRelations,
      samplingOptions,
      newSelectedCollections,
    } = state.reselectCollections;
    return {
      collections: databaseCollections,
      selectedCollections: [...newSelectedCollections, ...selectedCollections],
      disabledCollections: selectedCollections,
      automaticallyInferRelationships: automaticallyInferRelations,
      samplingOptions,
      isFetchingCollections: false,
      error,
    };
  },
  {
    onCollectionsSelect: selectCollections,
    onAutomaticallyInferRelationshipsToggle: toggleInferRelationships,
    onSamplingOptionsChange: changeSamplingOptions,
  }
)(SelectCollectionsList);

function SelectConnection({
  selectedConnectionId,
  onConnectionSelect,
  isConnecting,
  error,
}: {
  selectedConnectionId?: string;
  onConnectionSelect: (id: string) => void;
  isConnecting: boolean;
  error?: Error;
}) {
  const connections = useSavedConnections();
  return (
    <Combobox
      label="Connection"
      placeholder="Select connection"
      aria-label="Select connection"
      value={selectedConnectionId ?? ''}
      data-testid="reselect-collections-connection-selector"
      onChange={(connectionId) => {
        if (connectionId) {
          onConnectionSelect(connectionId);
        }
      }}
      clearable={false}
      multiselect={false}
      disabled={isConnecting}
      state={error ? 'error' : undefined}
      errorMessage={error?.message}
    >
      {connections.map((connection) => {
        return (
          <ComboboxOption
            key={connection.id}
            value={connection.id}
            displayName={connection.name}
            description={connection.description}
          ></ComboboxOption>
        );
      })}
    </Combobox>
  );
}

const SelectConnectionStep = connect(
  (state: DataModelingState) => {
    const {
      reselectCollections: { isConnecting, selectedConnectionId, error },
    } = state;
    return {
      isConnecting,
      error,
      selectedConnectionId,
    };
  },
  {
    onConnectionSelect: selectConnection,
  }
)(SelectConnection);

type ReselectCollectionsModalProps = {
  isOpen: boolean;
  currentStep: ReselectCollectionsWizardState['step'];
  isConnectButtonDisabled: boolean;
  isGenerateDiagramDisabled: boolean;
  isConnecting: boolean;
  numSelectedCollections: number;
  numTotalCollections: number;
  selectedDatabaseName: string;
  onCancel: () => void;
  onConnect: () => void;
  onGenerate: () => void;
};

const ReselectCollectionsModal: React.FunctionComponent<
  ReselectCollectionsModalProps
> = ({
  isOpen,
  currentStep,
  isGenerateDiagramDisabled,
  isConnecting,
  isConnectButtonDisabled,
  numSelectedCollections,
  numTotalCollections,
  selectedDatabaseName,
  onCancel,
  onConnect,
  onGenerate,
}) => {
  const formStepProps = useMemo(() => {
    switch (currentStep) {
      case 'SELECT_CONNECTION':
        return {
          title: 'Select connection',
          description:
            'To fetch the collections for this database, select and connect to the database associated with this data model first.',
          onNextClick: onConnect,
          onPreviousClick: onCancel,
          nextLabel: 'Connect',
          previousLabel: 'Cancel',
          isNextDisabled: isConnectButtonDisabled,
          step: currentStep,
          isLoading: isConnecting,
        };
      case 'SELECT_COLLECTIONS':
        return {
          title: `Select collections for ${selectedDatabaseName}`,
          description:
            'These collections will be included in your generated diagram.',
          onNextClick: onGenerate,
          onPreviousClick: onCancel,
          nextLabel: 'Generate',
          previousLabel: 'Cancel',
          isNextDisabled: isGenerateDiagramDisabled,
          step: currentStep,
          footerText: numTotalCollections > 0 && (
            <>
              <strong>{numSelectedCollections}</strong>/
              <strong>{numTotalCollections}</strong> total{' '}
              {numTotalCollections === 1 ? 'collection' : 'collections'}{' '}
              selected.
            </>
          ),
        };
      default:
        throw new Error(`Unknown diagram generation step: "${currentStep}"`);
    }
  }, [
    currentStep,
    isConnectButtonDisabled,
    isGenerateDiagramDisabled,
    numSelectedCollections,
    numTotalCollections,
    selectedDatabaseName,
    onCancel,
    onConnect,
    onGenerate,
    isConnecting,
  ]);

  return (
    <Modal
      open={isOpen}
      data-testid="reselect-collections-modal"
      setOpen={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <ModalStepContainer {...formStepProps}>
        {currentStep === 'SELECT_CONNECTION' ? (
          <SelectConnectionStep />
        ) : currentStep === 'SELECT_COLLECTIONS' ? (
          <SelectCollectionsStep />
        ) : null}
      </ModalStepContainer>
    </Modal>
  );
};

export default connect(
  (state: DataModelingState) => {
    const {
      isOpen,
      step: currentStep,
      error,
      isConnecting,
      databaseCollections,
      selectedConnectionId,
      selectedDatabase,
      selectedCollections,
      newSelectedCollections,
      samplingOptions,
    } = state.reselectCollections;

    const numSelectedCollections =
      newSelectedCollections.length +
      // Among selected collections, only count those that belong to the current database
      selectedCollections.filter((x) => databaseCollections.includes(x)).length;

    return {
      isOpen,
      currentStep,
      isConnectButtonDisabled:
        isConnecting ||
        Boolean(error) ||
        !selectedConnectionId ||
        !selectedDatabase,
      isGenerateDiagramDisabled:
        databaseCollections.length === 0 ||
        newSelectedCollections.length === 0 ||
        ((samplingOptions?.sampleSize === undefined ||
          samplingOptions?.sampleSize <= 0) &&
          samplingOptions.allDocuments === undefined) ||
        selectIsAnalysisInProgress(state),
      numSelectedCollections,
      numTotalCollections: databaseCollections.length,
      selectedDatabaseName: selectedDatabase || '',
      isConnecting,
      samplingOptions,
    };
  },
  {
    onCancel: hideReselectCollections,
    onConnect: establishConnection,
    onGenerate: startRedoAnalysis,
  }
)(ReselectCollectionsModal);
