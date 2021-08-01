import React from 'react';

type Props = {
  databaseName?: string,
  collectionName?: string
  // TODO: onclick functions.
}

function Breadcrumb({
  collectionName,
  databaseName
}: Props): React.ReactElement {
  return (
    <div
      // {...props}
    >
      {databaseName && <button
        // className={}
        onClick={() => { alert('open instance'); }}
        // href="#"
      >
        Instance
      </button>}
      {databaseName && <button
        // className={}
        onClick={() => { alert(`open db ${databaseName}`); }}
        // href="#"
      >
        {databaseName}
      </button>}
      <span>.</span>
      <span>
        {collectionName}
      </span>
    </div>
  );
}

export default Breadcrumb;
