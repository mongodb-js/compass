import React from 'react';
// import LeafyGreenConfirmationModal from '@leafygreen-ui/confirmation-modal';

// import Collection from '@mongodb-js/compass-collection';
// import Database from '@mongodb-js/compass-database';
// import Instance from '@mongodb-js/compass-instance';

import Breadcrumb from './Breadcrumb';
import { Namespace } from './types';
import Database from './Database';
import Instance from './Instance';
import ErrorBoundary from './ErrorBoundary';

type FieldValue = unknown;

type Stage = {
  [stageField: string]: FieldValue
};

type CollectionAttributes = {
  editViewName?: string,
  isReadOnly: boolean,
  isTimeSeries: boolean,
  sourceName?: string,
  sourceReadonly?: boolean,
  sourceViewOn?: string,
  sourcePipeline?: Stage[]
}

type Props = {
  databaseName?: string,
  collectionName?: string,
  collectionAttributes?: CollectionAttributes,
  isDataLake: boolean,
  updateNamespace: (ns: Namespace) => void
}

function Panel({
  collectionName,
  databaseName,
  isDataLake,
  updateNamespace
}: Props): React.ReactElement {
  // console.log('render panel,', databaseName, collectionName);

  // const [ instance, setInstance ] = useState(null);

  // global

  const CollectionComponent = (global as any).hadronApp.appRegistry.getRole(
    'Collection.Workspace'
  )[0].component;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Breadcrumb
        databaseName={databaseName}
        collectionName={collectionName}
        updateNamespace={updateNamespace}
      />
      <ErrorBoundary>
        {!databaseName && <Instance
          isDataLake={isDataLake}
          updateNamespace={updateNamespace}
        />}
        {databaseName && !collectionName && (
          <Database
            databaseName={databaseName}
            updateNamespace={updateNamespace}
          />
        )}
        {databaseName && collectionName && (
          <CollectionComponent
            appRegistry={(global as any).hadronApp.appRegistry}
            dataService={(global as any).hadronApp.appRegistry.stores[
              'Connect.Store'
            ].dataService}
            collectionName={collectionName}
            databaseName={databaseName}
            // dataService={datase}
            isDataLake={isDataLake}
            updateNamespace={updateNamespace}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}
          // namespace={this.props.namespace}

        // <Collection
        //   collectionName={collectionName}
        //   databaseName={databaseName}
        //   isDataLake={isDataLake}
        // />
        // <div>Collection</div>

export default Panel;
