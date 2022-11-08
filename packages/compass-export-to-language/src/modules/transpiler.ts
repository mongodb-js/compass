import toNS from 'mongodb-ns';
import compiler from 'bson-transpilers';
import { maybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';

import type { OutputLanguage } from './languages';

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

export type InputExpression = AggregationExpression | QueryExpression;

export function getInputExpressionMode(
  inputExpression: InputExpression
): 'Query' | 'Pipeline' {
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

  useBuilders = useBuilders && outputLanguage === 'java' && mode === 'Query';

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
    // TODO: what should we do about the fact that compile() ignores everything
    // except 'filter' for queries? (ie. projection, sort, etc) whereas
    // compileWithDriver() takes all that into account?
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
    const imports = compiler.shell[outputLanguage].getImports(includeDrivers);
    output = `${imports as string}\n\n${output}`;
  }

  return output;
}
