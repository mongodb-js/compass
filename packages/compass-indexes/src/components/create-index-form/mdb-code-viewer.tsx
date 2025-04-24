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
    let codeStr = `db.getSiblingDB("${dbName}").getCollection("${collectionName}").createIndex{(\n`;

    Object.entries(indexNameTypeMap).forEach(([name, type], index) => {
      // Replacing everything inside the parenthesis i.e. (asc)
      const parsedType = type.replace(/\(.*?\)/g, '').trim();
      codeStr += `  ${name}: "${parsedType}"`;

      if (index !== Object.keys(indexNameTypeMap).length - 1) {
        codeStr += ',';
      }

      codeStr += '\n';
    });

    codeStr += `});`;
    return codeStr;
  };

  return (
    <Code data-testid="mdb-code-viewer" language="javascript">
      {generateCode()}
    </Code>
  );
};

export default MDBCodeViewer;
