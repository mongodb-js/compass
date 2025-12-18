import {
  Banner,
  Combobox,
  ComboboxOption,
  css,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../../store/reducer';
import { useConnectionsList } from '@mongodb-js/compass-connections/provider';
import { type GenerateDiagramWizardState } from '../../store/generate-diagram-wizard';
import {
  changeName,
  selectConnection,
  selectDatabase,
} from '../../store/generate-diagram-wizard';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[600],
  marginTop: spacing[600],
  marginBottom: spacing[600],
});
const connectionAndDatabaseContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[400],
  '& > div': {
    flex: 1,
  },
});

type SetupDiagramStepProps = {
  diagramName: GenerateDiagramWizardState['formFields']['diagramName'];
  selectedConnection: GenerateDiagramWizardState['formFields']['selectedConnection'];
  selectedDatabase: GenerateDiagramWizardState['formFields']['selectedDatabase'];
  databases: string[];

  onNameChange: (name: string) => void;
  onConnectionSelect: (connectionId: string) => void;
  onDatabaseSelect: (databaseName: string) => void;
};

const SetupDiagramStep = ({
  diagramName,
  selectedConnection,
  selectedDatabase,
  databases,
  onNameChange,
  onConnectionSelect,
  onDatabaseSelect,
}: SetupDiagramStepProps) => {
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

  const connectionErrorMessage = useMemo(() => {
    if (selectedConnection.error) {
      return selectedConnection.error.message;
    }
    if (connections.length === 0) {
      return 'You do not have any connections, create a new connection first.';
    }
    return undefined;
  }, [selectedConnection.error, connections.length]);

  const databaseErrorMessage = useMemo(() => {
    if (connectionErrorMessage) {
      // Let the connection error show first
      return undefined;
    }
    if (selectedDatabase.error) {
      return selectedDatabase.error.message;
    }
    if (databases.length === 0) {
      return 'No databases found for the selected connection.';
    }
    return undefined;
  }, [connectionErrorMessage, selectedDatabase.error, databases.length]);

  return (
    <div className={containerStyles}>
      <div className={connectionAndDatabaseContainerStyles}>
        <Combobox
          label="Connection"
          placeholder="Select connection"
          aria-label="Select connection"
          value={selectedConnection.value ?? ''}
          data-testid="new-diagram-connection-selector"
          onChange={(connectionId) => {
            if (connectionId) {
              onConnectionSelect(connectionId);
            }
          }}
          clearable={false}
          multiselect={false}
          disabled={selectedConnection.isConnecting}
          state={connectionErrorMessage ? 'error' : undefined}
          errorMessage={connectionErrorMessage}
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
        <Combobox
          label="Database"
          placeholder="Select database"
          aria-label="Select database"
          value={selectedDatabase.value ?? ''}
          data-testid="new-diagram-database-selector"
          onChange={(databaseName) => {
            if (databaseName) {
              onDatabaseSelect(databaseName);
            }
          }}
          clearable={false}
          multiselect={false}
          disabled={
            !selectedConnection.value || selectedConnection.isConnecting
          }
          state={databaseErrorMessage ? 'error' : undefined}
          errorMessage={databaseErrorMessage}
        >
          {databases.map((db) => {
            return <ComboboxOption key={db} value={db}></ComboboxOption>;
          })}
        </Combobox>
      </div>
      <TextInput
        label="Diagram name"
        value={diagramName.value}
        data-testid="new-diagram-name-input"
        onChange={(e) => {
          onNameChange(e.currentTarget.value);
        }}
        state={diagramName.error ? 'error' : undefined}
        errorMessage={diagramName.error?.message}
      ></TextInput>
      <Banner variant="info">
        Diagram will be generated from a sample of documents in the selected
        database. Changes made to the diagram will not impact your data.
      </Banner>
    </div>
  );
};

export default connect(
  ({ generateDiagramWizard }: DataModelingState) => {
    const {
      formFields: { diagramName, selectedConnection, selectedDatabase },
    } = generateDiagramWizard;
    return {
      diagramName,
      selectedConnection,
      selectedDatabase,
      databases: generateDiagramWizard.connectionDatabases ?? [],
    };
  },
  {
    onConnectionSelect: selectConnection,
    onDatabaseSelect: selectDatabase,
    onNameChange: changeName,
  }
)(SetupDiagramStep);
