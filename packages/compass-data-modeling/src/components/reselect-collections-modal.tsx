import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import {
  Combobox,
  ComboboxOption,
  Modal,
  useTranslation,
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
  gotoStep,
} from '../store/reselect-collections-wizard';
import { SelectCollectionsList } from './select-collections-list';
import { useSavedConnections } from '../utils/use-saved-connections';
import { ModalStepContainer } from './model-step-container';
import { areSamplingOptionsValid } from '../store/sampling-options';
import { DiagramSettingsContent } from './diagram-settings-content';

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

const DiagramSettingsStep = connect(
  (state: DataModelingState) => {
    const { automaticallyInferRelations, samplingOptions } =
      state.reselectCollections;
    return {
      automaticallyInferRelationships: automaticallyInferRelations,
      samplingOptions: samplingOptions,
    };
  },
  {
    onAutomaticallyInferRelationshipsToggle: toggleInferRelationships,
    onSamplingOptionsChange: changeSamplingOptions,
  }
)(DiagramSettingsContent);

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
  const t = useTranslation();
  const connections = useSavedConnections();
  return (
    <Combobox
      label={t('dataModeling.setup.connection', 'Connection')}
      placeholder={t(
        'dataModeling.setup.selectConnection',
        'Select connection'
      )}
      aria-label={t('dataModeling.setup.selectConnection', 'Select connection')}
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
  onStep: (step: ReselectCollectionsWizardState['step']) => void;
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
  onStep,
  onGenerate,
}) => {
  const t = useTranslation();
  const formStepProps = useMemo(() => {
    const collectionsSelectedFooter = numTotalCollections > 0 && (
      <>
        <strong>{numSelectedCollections}</strong>/
        <strong>{numTotalCollections}</strong>{' '}
        {numTotalCollections === 1
          ? t(
              'dataModeling.newDiagram.collectionsSelected.one',
              'total collection selected.'
            )
          : t(
              'dataModeling.newDiagram.collectionsSelected.other',
              'total collections selected.'
            )}
      </>
    );
    switch (currentStep) {
      case 'SELECT_CONNECTION':
        return {
          title: t(
            'dataModeling.reselect.selectConnectionTitle',
            'Select connection'
          ),
          description: t(
            'dataModeling.reselect.selectConnectionDescription',
            'To fetch the collections for this database, select and connect to the database associated with this data model first.'
          ),
          onNextClick: onConnect,
          onPreviousClick: onCancel,
          nextLabel: t('dataModeling.reselect.connect', 'Connect'),
          previousLabel: t('dataModeling.newDiagram.cancel', 'Cancel'),
          isNextDisabled: isConnectButtonDisabled,
          step: currentStep,
          isLoading: isConnecting,
        };
      case 'SELECT_COLLECTIONS':
        return {
          title: t(
            'dataModeling.newDiagram.selectCollectionsTitle',
            'Select collections for {database}',
            { database: selectedDatabaseName }
          ),
          description: t(
            'dataModeling.newDiagram.selectCollectionsDescription',
            'These collections will be included in your generated diagram.'
          ),
          onNextClick: () => onStep('DIAGRAM_SETTINGS'),
          onPreviousClick: onCancel,
          nextLabel: t('dataModeling.newDiagram.next', 'Next'),
          previousLabel: t('dataModeling.newDiagram.cancel', 'Cancel'),
          isNextDisabled: isGenerateDiagramDisabled,
          step: currentStep,
          footerText: collectionsSelectedFooter,
        };
      case 'DIAGRAM_SETTINGS':
        return {
          title: t('dataModeling.newDiagram.settingsTitle', 'Diagram settings'),
          onNextClick: onGenerate,
          onPreviousClick: () => onStep('SELECT_COLLECTIONS'),
          nextLabel: t('dataModeling.newDiagram.generate', 'Generate'),
          previousLabel: t('dataModeling.newDiagram.back', 'Back'),
          isNextDisabled: isGenerateDiagramDisabled,
          step: currentStep,
          footerText: collectionsSelectedFooter,
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
    onStep,
    onGenerate,
    isConnecting,
    t,
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
        ) : currentStep === 'DIAGRAM_SETTINGS' ? (
          <DiagramSettingsStep />
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
        !areSamplingOptionsValid(samplingOptions) ||
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
    onStep: gotoStep,
    onGenerate: startRedoAnalysis,
  }
)(ReselectCollectionsModal);
