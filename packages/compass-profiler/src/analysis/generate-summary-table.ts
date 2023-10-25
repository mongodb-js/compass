import { EJSON, type Document } from 'bson';
import { gatherUniqueFieldsFromQuery } from './generate-hints';

type Namespace = string;

type SummaryItem = {
  queryShape: string;
  querySample: string;
  queryFields: string[];
  costStore: number;
};

type SummaryGroup = {
  namespace: Namespace;
  items: SummaryItem[];
};

export type SummaryTable = SummaryGroup[];

export default function generateSummaryTable(
  profiledQueries: Document[]
): SummaryTable {
  const intermediateRepr = new Map<string, SummaryItem>();
  const timesHappenedQuery = new Map<string, number>();

  for (const profileItem of profiledQueries) {
    if (!profileItem || profileItem.op !== 'query') {
      continue;
    }

    const queryShape = profileItem.queryHash;
    const namespace = `${profileItem.ns.split('.', 2)[1]}`;
    const queryNamespace = `${namespace}::${queryShape}`;
    const querySample = EJSON.stringify(profileItem.command.filter);
    const queryFields = gatherUniqueFieldsFromQuery(profileItem.command.filter);

    const timesHappened = timesHappenedQuery.get(queryNamespace) || 0 + 1;
    timesHappenedQuery.set(queryNamespace, timesHappened);

    let baseCost: number = profileItem.millis;

    if (intermediateRepr.has(queryNamespace)) {
      const oldCost = intermediateRepr.get(queryNamespace)?.costStore || 0;
      baseCost = Math.max(oldCost, baseCost);
    }

    intermediateRepr.set(queryNamespace, {
      costStore: baseCost,
      querySample,
      queryShape,
      queryFields,
    });
  }

  const mergedResult = Array.from(intermediateRepr.entries()).reduce(
    (table, [queryNs, item]) => {
      const [namespace] = queryNs.split('::');
      item.costStore *= timesHappenedQuery.get(queryNs) || 1;
      const data = (table.get(namespace) || []).concat(item);
      table.set(namespace, data);

      return table;
    },
    new Map<Namespace, SummaryItem[]>()
  );

  return Array.from(mergedResult.entries()).map(([ns, items]) => {
    items.sort((a, b) => b.costStore - a.costStore);
    return { namespace: ns, items };
  });
}
