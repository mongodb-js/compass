import { Code, Link, css, spacing } from '@mongodb-js/compass-components';
import React from 'react';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

const programmingLanguageLinkStyles = css({
  marginLeft: 'auto',
  marginTop: spacing[100],
});

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
    <div className={containerStyles}>
      <Code data-testid="mdb-code-viewer" language="javascript">
        {generateCode()}
      </Code>
      <span className={programmingLanguageLinkStyles}>
        View programming language driver syntax{' '}
        <Link
          href="https://www.mongodb.com/docs/manual/core/indexes/create-index/"
          target="_blank"
          rel="noreferrer noopener"
        >
          here
        </Link>
        .
      </span>
    </div>
  );
};

export default MDBCodeViewer;
