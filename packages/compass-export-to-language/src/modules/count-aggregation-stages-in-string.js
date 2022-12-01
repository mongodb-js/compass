import vm from 'vm';

let dummySandbox;

// We do want to report the number of stages in an aggregation
// for telemetry, but we only receive them as a string from
// the consumers of this package. Instead, we evaluate
// the code in a dummy sandbox environment and just count
// the number of stages in the result. This is a little inefficient,
// but ultimately a simpler solution than pulling in a query
// parser here.
export function countAggregationStagesInString(str) {
  if (!dummySandbox) {
    dummySandbox = vm.createContext(Object.create(null), {
      codeGeneration: { strings: false, wasm: false },
      microtaskMode: 'afterEvaluate',
    });
    vm.runInContext(
      [
        'BSONRegExp',
        'DBRef',
        'Decimal128',
        'Double',
        'Int32',
        'Long',
        'Int64',
        'MaxKey',
        'MinKey',
        'ObjectID',
        'ObjectId',
        'BSONSymbol',
        'Timestamp',
        'Code',
        'Buffer',
        'Binary',
      ]
        .map((name) => `function ${name}() {}`)
        .join('\n'),
      dummySandbox
    );
  }

  return vm.runInContext('(' + str + ')', dummySandbox, { timeout: 100 })
    .length;
}
