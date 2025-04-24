import { Code } from '@mongodb-js/compass-components';
import React from 'react';

const MDBCodeViewer = ({
  dbName,
  collectionName,
  indexNameTypeMap,
}: {
  dbName: string;
  collectionName: string;
  indexNameTypeMap: { [key: string]: string };
}) => {
  const generateCode = () => {
    let codeStr = `db.getSiblingDB("${dbName}").getCollection("${collectionName}").createIndex(\n`;

    Object.entries(indexNameTypeMap).forEach(([name, type]) => {
      // replacing everything inside the parenthesis i.e. (asc)
      const parsedType = type.trim().replace(/\(.*?\)/g, '');
      codeStr += `  ${name}: "${parsedType}"\n`;
    });

    codeStr += `});`;
    return codeStr;
  };

  return (
    <Code
      data-testid="query-flow-section-suggested-index"
      language="javascript"
    >
      {generateCode()}
    </Code>
  );
};

export default MDBCodeViewer;
