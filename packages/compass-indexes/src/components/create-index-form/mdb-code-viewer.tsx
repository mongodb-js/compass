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

const NUMERIC_INDEX_TYPES = [-1, 1];

const escapeText = (text: string) => {
  return text.replaceAll('"', '\\"');
};

const generateCode = ({
  dbName,
  collectionName,
  indexNameTypeMap,
}: {
  dbName: string;
  collectionName: string;
  indexNameTypeMap: { [key: string]: string };
}) => {
  let codeStr = `db.getSiblingDB("${dbName}").getCollection("${escapeText(
    collectionName
  )}").createIndex({\n`;

  Object.entries(indexNameTypeMap).forEach(([name, type], index) => {
    // Replacing everything inside the parenthesis i.e. (asc)
    let parsedType = escapeText(`${type}`.replace(/\(.*?\)/g, '')).trim();
    if (!NUMERIC_INDEX_TYPES.includes(Number(parsedType))) {
      parsedType = `"${parsedType}"`;
    }
    const parsedName = escapeText(name).trim();

    codeStr += `  "${parsedName}": ${parsedType}`;

    if (index !== Object.keys(indexNameTypeMap).length - 1) {
      codeStr += ',';
    }

    codeStr += '\n';
  });

  codeStr += `});`;
  return codeStr;
};

const MDBCodeViewer = ({
  dbName,
  collectionName,
  indexNameTypeMap,
  dataTestId,
}: {
  dbName: string;
  collectionName: string;
  indexNameTypeMap: { [key: string]: string };
  dataTestId?: string;
}) => {
  const GeneratedCode = generateCode({
    dbName,
    collectionName,
    indexNameTypeMap,
  });

  return (
    <div className={containerStyles}>
      <Code data-testid={dataTestId || 'mdb-code-viewer'} language="javascript">
        {GeneratedCode}
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
