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
        top: 15,
        left: 15,
        fontSize: '22px',
        // fontWeight: 'normal',
        transition: '150ms all'
      }}
    >
      {databaseName && (
        <>
          <a
            // className={}
            onClick={() => updateNamespace({})}
            href="#"
          >
            Databases
          </a>
          <div
            style={{
              display: 'inline-block',
              margin: '0px 2px'
            }}
          >.</div>
          {!collectionName && (
            <div
              style={{
                display: 'inline-block'
              }}
            >
              {databaseName}
            </div>
          )}
        </>
      )}
      {databaseName && collectionName && (
        <>
          <a
            // className={}
            onClick={() => updateNamespace({
              databaseName
            })}
            href="#"
          >
            {databaseName}
          </a>
          <div
            style={{
              display: 'inline-block',
              margin: '0px 2px'
            }}
          >.</div>
          <div
            // className={}
            // onClick={() => updateNamespace({
            //   collectionName,
            //   databaseName
            // })}
            // href="#"
            style={{
              display: 'inline-block'
            }}
          >
            {collectionName}
          </div>
        </>
      )}
    </div>
  );
}

export default Breadcrumb;
