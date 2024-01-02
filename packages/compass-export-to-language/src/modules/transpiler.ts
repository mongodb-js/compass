import toNS from 'mongodb-ns';
import compiler from 'bson-transpilers';
import { maybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';

import type { OutputLanguage } from './languages';

type QueryExportMode = 'Query' | 'Delete Query' | 'Update Query';

type PipelineExportMode = 'Pipeline';

export type ExportMode = PipelineExportMode | QueryExportMode;

const EXPORT_MODES: ExportMode[] = [
  'Pipeline',
  'Query',
  'Delete Query',
  'Update Query',
];

export type AggregationExpression = {
  exportMode: 'Pipeline';
  aggregation: string;
};

export type QueryExpression = {
  exportMode: 'Query' | 'Delete Query' | 'Update Query';
  filter: string;
  project?: string;
  sort?: string;
  collation?: string;
  skip?: string;
  limit?: string;
  maxTimeMS?: string;
};

export function isValidExportMode(val: any): val is ExportMode {
  return EXPORT_MODES.includes(val);
}

export type InputExpression = AggregationExpression | QueryExpression;

export function isQueryExpression(
  inputExpression: InputExpression
): inputExpression is QueryExpression {
  return ['Query', 'Delete Query', 'Update Query'].includes(
    inputExpression.exportMode
  );
}

type RunTranspilerOptions = {
  inputExpression: InputExpression;
  outputLanguage: OutputLanguage;
  includeImports: boolean;
  includeDrivers: boolean;
  useBuilders: boolean;
  uri: string;
  namespace: string;
  protectConnectionStrings: boolean;
};

export function runTranspiler({
  inputExpression,
  outputLanguage,
  includeImports,
  includeDrivers,
  useBuilders,
  uri,
  namespace,
  protectConnectionStrings,
}: RunTranspilerOptions) {
  const mode = inputExpression.exportMode;

  useBuilders =
    useBuilders &&
    outputLanguage === 'java' &&
    isQueryExpression(inputExpression);

  let output = '';

  if (includeDrivers) {
    const ns = toNS(namespace);
    const toCompile = Object.assign(
      {
        options: {
          collection: ns.collection,
          database: ns.database,
          uri: maybeProtectConnectionString(protectConnectionStrings, uri),
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
