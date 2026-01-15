import { findQueries } from './find-query';
import { aggregateQueries } from './aggregate-query';
import toNS from 'mongodb-ns';
import { UUID } from 'bson';

export type GenAiUsecase = {
  namespace: string;
  userInput: string;
  expectedOutput: string;
  name: string;
};

import airbnbListings from '../fixtures/airbnb.listingsAndReviews';
import berlinBars from '../fixtures/berlin.cocktailbars';
import netflixMovies from '../fixtures/netflix.movies';
import netflixComments from '../fixtures/netflix.comments';
import nycParking from '../fixtures/nyc.parking';

import { getSampleAndSchemaFromDataset } from '../utils';
import {
  buildAggregateQueryPrompt,
  buildFindQueryPrompt,
} from '../../../src/utils/gen-ai-prompt';

type DatasetSamples = {
  [key: string]: {
    sampleDocuments: unknown[];
    schema: Record<string, unknown>;
  };
};

async function getDatasets(): Promise<DatasetSamples> {
  return {
    'airbnb.listingsAndReviews': await getSampleAndSchemaFromDataset(
      airbnbListings
    ),
    'berlin.cocktailbars': await getSampleAndSchemaFromDataset(berlinBars),
    'netflix.movies': await getSampleAndSchemaFromDataset(netflixMovies),
    'netflix.comments': await getSampleAndSchemaFromDataset(netflixComments),
    'nyc.parking': await getSampleAndSchemaFromDataset(nycParking),
  };
}

export async function generateGenAiEvalCases() {
  const datasetSamples = await getDatasets();
  const usecases = [
    ...findQueries.map((x) => ({ ...x, type: 'find' as const })),
    ...aggregateQueries.map((x) => ({ ...x, type: 'aggregate' as const })),
  ];

  return usecases.map(
    ({ namespace, expectedOutput, userInput, name, type }) => {
      const { database: databaseName, collection: collectionName } =
        toNS(namespace);
      const { sampleDocuments, schema } = datasetSamples[namespace] ?? {
        sampleDocuments: [],
        schema: {},
      };
      const buildPromptData = {
        userInput,
        sampleDocuments,
        schema,
        collectionName,
        databaseName,
        enableStorage: false,
        requestId: new UUID().toString(),
        userId: 'compass-eval-tests-user',
      };
      const {
        metadata: { instructions },
        prompt,
      } =
        type === 'find'
          ? buildFindQueryPrompt(buildPromptData)
          : buildAggregateQueryPrompt(buildPromptData);
      return {
        name,
        tags: [name, databaseName, collectionName, type],
        input: {
          messages: [
            {
              role: 'user' as const,
              content: prompt,
            },
          ],
          instructions: {
            content: instructions,
          },
        },
        expected: {
          messages: [
            {
              content: expectedOutput,
            },
          ],
        },
      };
    }
  );
}
