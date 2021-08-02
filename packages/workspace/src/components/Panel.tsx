import React from 'react';
// import LeafyGreenConfirmationModal from '@leafygreen-ui/confirmation-modal';

import Collection from '@mongodb-js/compass-collection';
import Database from '@mongodb-js/compass-database';
// import Instance from '@mongodb-js/compass-instance';

import Breadcrumb from './Breadcrumb';
import { Namespace } from './types';
import Instance from './Instance';

type FieldValue = unknown;

type Stage = {
  [stageField: string]: FieldValue
};

type CollectionAttributes = {
  isReadOnly: boolean,
  isTimeSeries: boolean,
  sourceName?: string,
  sourceReadonly?: boolean,
  sourceViewOn?: string,
  pipeline?: Stage[]
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
  console.log('render panel,', databaseName, collectionName);

  // const [ instance, setInstance ] = useState(null);

  // global

  return (
    <>
      <Breadcrumb
        databaseName={databaseName}
        collectionName={collectionName}
        updateNamespace={updateNamespace}
      />
      {!databaseName && <Instance
        isDataLake={isDataLake}
        updateNamespace={updateNamespace}
      />}
      {databaseName && !collectionName && <Database />}
      {databaseName && collectionName && (
        <Collection
          collectionName={collectionName}
          databaseName={databaseName}
          isDataLake={isDataLake}
        />
      )}
    </>
  );
}

export default Panel;
