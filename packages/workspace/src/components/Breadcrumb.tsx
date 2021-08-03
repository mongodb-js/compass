import React from 'react';

type Namespace = {
  databaseName?: string,
  collectionName?: string
}

type Props = {
  databaseName?: string,
  collectionName?: string,
  updateNamespace: (ns: Namespace) => void
}

function Breadcrumb({
  collectionName,
  databaseName,
  updateNamespace
}: Props): React.ReactElement {
  return (
    <div
      // {...props}
      style={{
        position: 'absolute',
        top: 5,
        left: 5,
      }}
    >
      <button
        // className={}
        onClick={() => updateNamespace({})}
        // href="#"
      >
        Instance
      </button>
      {databaseName && (
        <>
          <div
            style={{
              display: 'inline-block'
            }}
          >.</div>
          <button
            // className={}
            onClick={() => updateNamespace({
              databaseName
            })}
            // href="#"
          >
            {databaseName}
          </button>
        </>
      )}
      {databaseName && collectionName && (
        <>
          <div
            style={{
              display: 'inline-block'
            }}
          >.</div>
          <button
            // className={}
            onClick={() => updateNamespace({
              collectionName,
              databaseName
            })}
            // href="#"
          >
            {collectionName}
          </button>
        </>
      )}
    </div>
  );
}

export default Breadcrumb;
