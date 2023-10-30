import toNS from 'mongodb-ns';
import compiler from 'bson-transpilers';
import { maybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';

import type { OutputLanguage } from './languages';

export type ExportMode = 'Query' | 'Pipeline' | 'Delete Query' | 'Update Query';

type WithExportMode = {
  exportMode?: ExportMode;
};

type AggregationExpression = {
  aggregation: string;
};

type QueryExpression = {
  filter: string;
  project?: string;
  sort?: string;
  collation?: string;
  skip?: string;
  limit?: string;
  maxTimeMS?: string;
};

export function isQuery(exportMode?: ExportMode) {
  return exportMode === 'Query' || exportMode === 'Delete Query';
}

export type InputExpression = WithExportMode &
  (AggregationExpression | QueryExpression);

export function getInputExpressionMode(
  inputExpression: InputExpression
): ExportMode {
  if (inputExpression.exportMode) {
    return inputExpression.exportMode;
  }

  if ('filter' in inputExpression) {
    return 'Query';
  }
  return 'Pipeline';
}

type RunTranspilerOptions = {
  inputExpression: InputExpression;
  outputLanguage: OutputLanguage;
  includeImports: boolean;
  includeDrivers: boolean;
  useBuilders: boolean;
  uri: string;
  namespace: string;
};

export function runTranspiler({
  inputExpression,
  outputLanguage,
  includeImports,
  includeDrivers,
  useBuilders,
  uri,
  namespace,
}: RunTranspilerOptions) {
  const mode = getInputExpressionMode(inputExpression);

  useBuilders = useBuilders && outputLanguage === 'java' && isQuery(mode);
  let output = '';

  if (includeDrivers) {
    const ns = toNS(namespace);
    const toCompile = Object.assign(
      {
        options: {
          collection: ns.collection,
          database: ns.database,
          uri: maybeProtectConnectionString(uri),
        },
      },
      inputExpression
    );
    output = compiler.shell[outputLanguage].compileWithDriver(
      toCompile,
      useBuilders
    );
  } else {
    const toCompile =
      'aggregation' in inputExpression
        ? inputExpression.aggregation
        : inputExpression.filter;
    output = compiler.shell[outputLanguage].compile(
      toCompile,
      useBuilders,
      false
    );
  }

  if (includeImports) {
    // bson-transpilers appears to be stateful, so getImports() has to be called after compile()
    const imports = compiler.shell[outputLanguage].getImports(
      mode,
      includeDrivers
    );
    output = `${imports as string}\n\n${output}`;
  }

  return output;
}
