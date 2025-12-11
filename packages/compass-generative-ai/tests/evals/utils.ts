import { getSimplifiedSchema } from 'mongodb-schema';
import type { Message } from './types';
import { EJSON } from 'bson';

export function allText(messages: Message[]): string {
  return messages.map((m) => m.content).join('\n');
}

export function sampleItems<T>(arr: T[], k: number): T[] {
  if (k > arr.length) {
    throw new Error('Sample size cannot be greater than array length');
  }

  const result: T[] = [];
  const indices = new Set<number>();

  while (result.length < k) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    if (!indices.has(randomIndex)) {
      indices.add(randomIndex);
      result.push(arr[randomIndex]);
    }
  }
  return result;
}

export async function getSampleAndSchemaFromDataset(
  dataset: unknown[],
  sampleSize = 2
): Promise<{ sampleDocuments: any[]; schema: any }> {
  const documents = sampleItems(dataset, Math.min(sampleSize, dataset.length));
  // BSON list
  const sampleDocuments = EJSON.parse(JSON.stringify(documents));
  const schema = await getSimplifiedSchema(sampleDocuments);
  return { sampleDocuments, schema };
}
