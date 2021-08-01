import React from 'react';
// import LeafyGreenConfirmationModal from '@leafygreen-ui/confirmation-modal';

import Collection from '@mongodb-js/compass-collection';
import Database from '@mongodb-js/compass-database';
import Instance from '@mongodb-js/compass-instance';
import Breadcrumb from './Breadcrumb';

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
  // TODO: Panel type: shell, etc.
}

function Panel({
  collectionName,
  databaseName,
  isDataLake
}: Props): React.ReactElement {
  console.log('render panel,', databaseName, collectionName);

  return (
    <>
      <Breadcrumb
        databaseName={databaseName}
        collectionName={collectionName}
      />
      {!databaseName && <Instance
        isDataLake={isDataLake}
      />}
      {databaseName && !collectionName && <Database />}
      {databaseName && collectionName && (
        <Collection
          // TODO: Don't use one namespace, seperate db and col name.
          namespace={`${databaseName}.${collectionName}`}
          isDataLake={isDataLake}
        />
      )}
    </>
  );
}

export default Panel;
