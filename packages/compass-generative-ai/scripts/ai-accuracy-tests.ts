/* eslint-disable no-console */

// To run these tests against cloud-dev:
// > ATLAS_PUBLIC_KEY="..." \
//   ATLAS_PRIVATE_KEY="..." \
//   AI_TESTS_ATTEMPTS_PER_TEST=100 \
//     npm run ai-accuracy-tests

// To run these tests with local mms:
// First create an API key in your Atlas organization with
// the permissions "Organization Member".
// Then using that key run:
// > ATLAS_PUBLIC_KEY="..." \
//   ATLAS_PRIVATE_KEY="..." \
//   AI_TESTS_BACKEND=atlas-local \
//     npm run ai-accuracy-tests

// To run these tests with open ai:
// > OPENAI_API_KEY="..." \
//     npm run ai-accuracy-tests

import { MongoCluster } from 'mongodb-runner';
import os from 'os';
import assert from 'assert';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';
import type { Document } from 'bson';
import { getSimplifiedSchema } from 'mongodb-schema';
import type { SimplifiedSchema } from 'mongodb-schema';
import path from 'path';
import util from 'util';
import { execFile as callbackExecFile } from 'child_process';

import { AtlasAPI, createAIChatCompletion } from './ai-backend';
import { loadFixturesToDB } from './fixtures';
import type { Fixtures } from './fixtures';
import { extractDelimitedText, parseShellString } from './ai-response';
import {
  getAggregationSystemPrompt,
  getAggregationUserPrompt,
  getQuerySystemPrompt,
  getQueryUserPrompt,
} from './prompt';
import { SchemaFormatter } from './schema';

const execFile = util.promisify(callbackExecFile);

const DEFAULT_ATTEMPTS_PER_TEST = 10;
const DEFAULT_MIN_ACCURACY = 0.8;

const MAX_TIMEOUTS_PER_TEST = 10;

// There are a limited amount of resources available both on the Atlas
// and on the ai service side of things, so we want to limit how many
// requests can be happening at a time.
const TESTS_TO_RUN_CONCURRENTLY = 3;

// To avoid rate limit we also reduce the time between tests running
// when the test returns a result quickly.
const ADD_TIMEOUT_BETWEEN_TESTS_THRESHOLD_MS = 5000;
const TIMEOUT_BETWEEN_TESTS_MS = 3000;

const monorepoRoot = path.join(__dirname, '..', '..', '..');
const TEST_RESULTS_DB = 'test_generative_ai_accuracy_evergreen';
const TEST_RESULTS_COL = 'evergreen_runs';

// p-queue has to be dynamically imported as it's ESM only.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let PQueue: typeof import('p-queue').default;

const ATTEMPTS_PER_TEST = process.env.AI_TESTS_ATTEMPTS_PER_TEST
  ? +process.env.AI_TESTS_ATTEMPTS_PER_TEST
  : DEFAULT_ATTEMPTS_PER_TEST;

const AI_TESTS_USE_SAMPLE_DOCS =
  process.env.AI_TESTS_USE_SAMPLE_DOCS === 'true';

type AITestError = Error & {
  errorCode?: string;
  status?: number;
  query?: string;
  prompt?: string;
  causedBy?: Error;
};

type TestResult = {
  Type: string;
  'User Input': string;
  Namespace: string;
  Accuracy: number;
  Pass: '✗' | '✓';
  'Time Elapsed (MS)': number;
};

type QueryOptions = {
  schema: SimplifiedSchema;
  collectionName: string;
  databaseName: string;
  sampleDocuments: Document[] | undefined;
  userInput: string;
};

const atlasBackend = new AtlasAPI();

const USE_ATLAS = !process.env['OPENAI_API_KEY'];

type UsageStats = { promptTokens: number; completionTokens: number };

type GenerationResponse = {
  prompt?: string;
  content?: any;
  query?: {
    filter?: string;
    project?: string;
    sort?: string;
    limit?: string;
    skip?: string;
  };
  aggregation?: string;
  usageStats?: UsageStats;
};

function getFieldsFromCompletionResponse({
  completion,
  userInput,
}: {
  completion: Awaited<ReturnType<typeof createAIChatCompletion>>;
  userInput: string;
}): GenerationResponse {
  const content = completion.choices[0].message.content;

  return {
    content,
    prompt: userInput,
    query: Object.fromEntries(
      ['filter', 'project', 'skip', 'limit', 'sort'].map((delimiter) => [
        delimiter,
        extractDelimitedText(content ?? '', delimiter),
      ])
    ),
    aggregation: extractDelimitedText(content ?? '', 'aggregation'),

    ...(completion.usage
      ? {
          usageStats: {
            promptTokens: completion.usage?.prompt_tokens,
            completionTokens: completion.usage?.completion_tokens,
          },
        }
      : {}),
  };
}

export async function generateFindQuery(
  options: QueryOptions
): Promise<GenerationResponse> {
  if (USE_ATLAS) {
    const response = await atlasBackend.fetchAtlasPrivateApi(
      '/ai/api/v1/mql-query?request_id=generative_ai_accuracy_test',
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    );
    return {
      content: response.content,
      prompt: response.prompt,
      query: response?.content?.query,
      aggregation: response?.content?.aggregation?.pipeline,
    };
  }

  const completion = await createAIChatCompletion({
    system: getQuerySystemPrompt(),
    user: getQueryUserPrompt({
      ...options,
      schema: new SchemaFormatter().format(options.schema),
    }),
  });
  return getFieldsFromCompletionResponse({
    userInput: options.userInput,
    completion,
  });
}

export async function generateAggregation(
  options: QueryOptions
): Promise<GenerationResponse> {
  if (USE_ATLAS) {
    const response = await atlasBackend.fetchAtlasPrivateApi(
      '/ai/api/v1/mql-aggregation?request_id=generative_ai_accuracy_test',
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    );
    return {
      content: response.content,
      prompt: response.prompt,
      query: response?.content?.query,
      aggregation: response?.content?.aggregation?.pipeline,
    };
  }

  const completion = await createAIChatCompletion({
    system: getAggregationSystemPrompt(),
    user: getAggregationUserPrompt({
      ...options,
      schema: new SchemaFormatter().format(options.schema),
    }),
  });

  return getFieldsFromCompletionResponse({
    userInput: options.userInput,
    completion,
  });
}

let cluster: MongoCluster;
let mongoClient: MongoClient;

export const generateMQL = async ({
  type,
  databaseName,
  mongoClient,
  collectionName,
  userInput,
  includeSampleDocuments,
}: {
  type: string;
  databaseName: string;
  mongoClient: MongoClient;
  collectionName: string;
  userInput: string;
  includeSampleDocuments?: boolean;
}): Promise<GenerationResponse> => {
  const collection = mongoClient.db(databaseName).collection(collectionName);
  const schema = await getSimplifiedSchema(collection.find());
  const sample = await collection.find().limit(2).toArray();

  if (type === 'aggregation') {
    return generateAggregation({
      schema: schema,
      collectionName,
      databaseName,
      sampleDocuments:
        includeSampleDocuments || AI_TESTS_USE_SAMPLE_DOCS ? sample : undefined,
      userInput,
    });
  }

  return generateFindQuery({
    schema: schema,
    collectionName,
    databaseName,
    sampleDocuments:
      includeSampleDocuments || AI_TESTS_USE_SAMPLE_DOCS ? sample : undefined,
    userInput,
  });
};

type TestOptions = {
  type: string;
  databaseName: string;
  collectionName: string;
  includeSampleDocuments?: boolean;
  userInput: string;
  // When supplied, this overrides the general test accuracy requirement. (0-1)
  minAccuracyForTest?: number;
  assertResult?: (responseContent: Document[]) => Promise<void> | void;
  acceptAggregationResponse?: boolean;
};

// eslint-disable-next-line complexity
const runOnce = async ({
  type,
  databaseName,
  collectionName,
  userInput,
  includeSampleDocuments,
  assertResult,
  acceptAggregationResponse,
}: TestOptions): Promise<UsageStats | void> => {
  const response = await generateMQL({
    type,
    databaseName,
    collectionName,
    userInput,
    includeSampleDocuments,
    mongoClient,
  });

  try {
    const collection = mongoClient.db(databaseName).collection(collectionName);

    const aggregation = response?.aggregation;
    const query = response?.query ?? {};

    if (assertResult) {
      let cursor;

      if (
        type === 'aggregation' ||
        (type === 'query' &&
          acceptAggregationResponse &&
          aggregation &&
          aggregation !== '[]')
      ) {
        cursor = collection.aggregate(parseShellString(aggregation));
      } else {
        cursor = collection.find(parseShellString(query.filter));

        if (query.project) {
          cursor = cursor.project(parseShellString(query.project));
        }

        if (query.sort) {
          cursor = cursor.sort(parseShellString(query.sort));
        }

        if (query.limit && query.limit !== '0') {
          cursor = cursor.limit(parseShellString(query.limit));
        }

        if (query.skip && query.skip !== '0') {
          cursor = cursor.skip(parseShellString(query.skip));
        }
      }

      const result = (await cursor.toArray()).map((doc) =>
        EJSON.serialize(doc)
      );

      await assertResult(result);
    }
  } catch (error: unknown) {
    const newError: AITestError = new Error('Inaccurate query generated');
    newError.errorCode = 'INACCURATE_QUERY_GENERATED';
    newError.query = (error as Error).message;
    newError.prompt = response.prompt;
    newError.causedBy = error as Error;
    console.log('Incorrect result, response:');
    console.log(response?.content);
    throw error;
  }

  return response.usageStats;
};

const runTest = async (
  testOptions: TestOptions
): Promise<{
  accuracy: number;
  timeouts: number;
  totalTestTimeMS: number;
  usageStats?: UsageStats[];
}> => {
  const usageStats: UsageStats[] = [];
  const attempts = ATTEMPTS_PER_TEST;
  let fails = 0;
  let timeouts = 0;
  let lastTestTimeMS = 0;
  let totalTestTimeMS = 0;

  for (let i = 0; i < attempts; i++) {
    if (timeouts >= MAX_TIMEOUTS_PER_TEST) {
      throw new Error('Too many timeouts');
    }
    const startTime = Date.now();

    if (
      attempts > 0 &&
      lastTestTimeMS < ADD_TIMEOUT_BETWEEN_TESTS_THRESHOLD_MS
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUT_BETWEEN_TESTS_MS)
      );
    }

    const testStartTime = Date.now();

    try {
      console.info('---------------------------------------------------');
      console.info('Running', JSON.stringify(testOptions.userInput));
      console.info('Attempt', i + 1, 'of', attempts, 'Failures:', fails);
      const stats = await runOnce(testOptions);
      if (stats) {
        usageStats.push(stats);
      }

      console.info('OK');
      totalTestTimeMS += Date.now() - testStartTime;
    } catch (e: unknown) {
      totalTestTimeMS += Date.now() - testStartTime;
      if ((e as AITestError).errorCode === 'GATEWAY_TIMEOUT') {
        i--;
        timeouts++;

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.error(e);
        console.info('FAILED');
        fails++;
      }
    }
    lastTestTimeMS = Date.now() - startTime;
  }

  const accuracy = (attempts - fails) / attempts;

  return { accuracy, timeouts, totalTestTimeMS, usageStats };
};

let fixtures: Fixtures = {};

async function setup() {
  // p-queue is ESM-only in recent versions.
  PQueue = (await eval(`import('p-queue')`)).default;

  cluster = await MongoCluster.start({
    tmpDir: os.tmpdir(),
    topology: 'standalone',
  });

  mongoClient = new MongoClient(cluster.connectionString);

  fixtures = await loadFixturesToDB({
    mongoClient,
  });
}

async function teardown() {
  await mongoClient?.close();
  await cluster?.close();
}

const isDeepStrictEqualTo = (expected: unknown) => (actual: unknown) =>
  assert.deepStrictEqual(actual, expected);

const isDeepStrictEqualToFixtures =
  (db: string, coll: string, comparator: (document: Document) => boolean) =>
  (actual: unknown) => {
    const expected = fixtures[db][coll].filter(comparator);
    assert.deepStrictEqual(actual, expected);
  };

const anyOf =
  (assertions: ((result: unknown) => void)[]) => (actual: unknown) => {
    const errors: Error[] = [];
    for (const assertion of assertions) {
      try {
        assertion(actual);
      } catch (e) {
        errors.push(e as Error);
      }
    }

    if (errors.length === assertions.length) {
      throw errors[errors.length - 1];
    }
  };

/**
 * Insert the generative ai results to a db
 * so we can track how they perform overtime.
 */
async function pushResultsToDB({
  results,
  anyFailed,
  runTimeMS,
  httpErrors,
}: {
  results: TestResult[];
  anyFailed: boolean;
  runTimeMS: number;
  httpErrors: number;
}) {
  const client = new MongoClient(
    process.env.AI_ACCURACY_RESULTS_MONGODB_CONNECTION_STRING || ''
  );

  try {
    const database = client.db(TEST_RESULTS_DB);
    const collection = database.collection(TEST_RESULTS_COL);

    const gitCommitHash = await execFile('git', ['rev-parse', 'HEAD'], {
      cwd: monorepoRoot,
    });

    const doc = {
      gitHash: gitCommitHash.stdout.trim(),
      completedAt: new Date(),
      attemptsPerTest: ATTEMPTS_PER_TEST,
      anyFailed,
      httpErrors,
      totalRunTimeMS: runTimeMS, // Total elapsed time including timeouts to avoid rate limit.
      results: results.map((result) => {
        const { 'Time Elapsed (MS)': runTimeMS, Pass, ...rest } = result;
        return {
          runTimeMS,
          Pass: Pass === '✓',
          ...rest,
        };
      }),
    };

    await collection.insertOne(doc);
  } finally {
    await client.close();
  }
}

const tests: TestOptions[] = [
  {
    type: 'query',
    databaseName: 'netflix',
    collectionName: 'movies',
    userInput: 'find all the movies released in 1983',
    assertResult: isDeepStrictEqualToFixtures(
      'netflix',
      'movies',
      (doc: Document) => doc._id.$oid === '573b864df29313caabe35593'
    ),
  },
  {
    type: 'query',
    databaseName: 'netflix',
    collectionName: 'movies',
    userInput:
      'find three movies with alien in the title, show earliest movies first, only the _id, title and year',
    assertResult: isDeepStrictEqualTo([
      {
        _id: {
          $oid: '573b864ef29313caabe3907a',
        },
        title: "Alien 3: Collector's Edition",
        year: '1992',
      },
      {
        _id: {
          $oid: '573b864ef29313caabe39507',
        },
        title: 'Alien Chaser',
        year: '1996',
      },
      {
        _id: {
          $oid: '573b864df29313caabe36f05',
        },
        title: 'Alien Files',
        year: '1999',
      },
    ]),
  },
  {
    type: 'query',
    databaseName: 'NYC',
    collectionName: 'parking_2015',
    userInput:
      'find all the violations for the violation code 21 and only return the car plate',
    assertResult: anyOf([
      isDeepStrictEqualTo([
        {
          _id: {
            $oid: '5735040085629ed4fa8394a5',
          },
          'Plate ID': 'FPG1269',
        },
        {
          _id: {
            $oid: '5735040085629ed4fa8394bd',
          },
          'Plate ID': 'T645263C',
        },
      ]),
      isDeepStrictEqualTo([
        {
          'Plate ID': 'FPG1269',
        },
        {
          'Plate ID': 'T645263C',
        },
      ]),
    ]),
  },
  {
    type: 'query',
    databaseName: 'berlin',
    collectionName: 'cocktailbars',
    userInput:
      'all the bars 10km from the berlin center, hint: use $nearSphere and $geometry',
    assertResult: isDeepStrictEqualToFixtures(
      'berlin',
      'cocktailbars',
      (doc: Document) => doc._id.$oid === '5ca652bf56618187558b4de3'
    ),
  },
  {
    type: 'query',
    databaseName: 'sample_airbnb',
    collectionName: 'listingsAndReviews',
    userInput:
      'Return all the properties of type "Hotel" and with ratings lte 70',
    assertResult: isDeepStrictEqualToFixtures(
      'sample_airbnb',
      'listingsAndReviews',
      (doc: Document) => doc._id === '10115921'
    ),
  },
  {
    // Test for how we pass aggregations instead of query properties.
    type: 'query',
    acceptAggregationResponse: true,
    databaseName: 'sample_airbnb',
    collectionName: 'listingsAndReviews',
    userInput:
      'what is the bed count that occurs the most? return it in a field called bedCount',
    assertResult: isDeepStrictEqualTo([
      {
        bedCount: 1,
      },
    ]),
  },
  {
    type: 'query',
    databaseName: 'delimiters',
    collectionName: 'filter',
    userInput: 'get all docs where filter is true',
    assertResult: isDeepStrictEqualTo([
      {
        _id: '1',
        filter: true,
      },
    ]),
  },
  {
    type: 'query',
    databaseName: 'sample_airbnb',
    collectionName: 'listingsAndReviews',
    userInput:
      'give me just the price and the first 3 amenities of the listing has "Step-free access" in its amenities.',
    assertResult: anyOf([
      isDeepStrictEqualTo([
        {
          _id: '10108388',
          price: {
            $numberDecimal: '185.00',
          },
          amenities: ['TV', 'Wifi', 'Air conditioning'],
        },
      ]),
      isDeepStrictEqualTo([
        {
          price: {
            $numberDecimal: '185.00',
          },
          amenities: ['TV', 'Wifi', 'Air conditioning'],
        },
      ]),
    ]),
  },
  {
    // Tests that sample documents work, as the field values are relevant
    // for building the correct query.
    type: 'query',
    databaseName: 'NYC',
    collectionName: 'parking_2015',
    userInput: 'The Plate IDs of Acura vehicles registered in New York',
    includeSampleDocuments: true,
    assertResult: anyOf([
      isDeepStrictEqualTo([
        {
          _id: {
            $oid: '5735040085629ed4fa839504',
          },
          'Plate ID': 'DRW5164',
        },
      ]),
      isDeepStrictEqualTo([
        {
          'Plate ID': 'DRW5164',
        },
      ]),
    ]),
  },
  {
    type: 'aggregation',
    databaseName: 'sample_airbnb',
    collectionName: 'listingsAndReviews',
    userInput:
      '¿Qué alojamiento tiene el precio más bajo? devolver el número en un campo llamado "precio"',
    assertResult: anyOf([
      isDeepStrictEqualTo([
        {
          precio: {
            $numberDecimal: '40.00',
          },
        },
      ]),
      isDeepStrictEqualTo([
        {
          _id: '10117617',
          precio: {
            $numberDecimal: '40.00',
          },
        },
      ]),
      isDeepStrictEqualTo([
        {
          precio: 40,
        },
      ]),
    ]),
  },
  {
    type: 'aggregation',
    databaseName: 'sample_airbnb',
    collectionName: 'listingsAndReviews',
    userInput:
      'give only me the cancellation policy and host url of the most expensive listing',
    assertResult: anyOf([
      isDeepStrictEqualTo([
        {
          cancellation_policy: 'moderate',
          host: {
            host_url: 'https://www.airbnb.com/users/show/51471538',
          },
        },
      ]),
      isDeepStrictEqualTo([
        {
          cancellation_policy: 'moderate',
          host_url: 'https://www.airbnb.com/users/show/51471538',
        },
      ]),
    ]),
  },
  {
    type: 'aggregation',
    databaseName: 'netflix',
    collectionName: 'movies',
    userInput: 'find all the movies released in 1983',
    assertResult: isDeepStrictEqualTo([
      {
        _id: {
          $oid: '573b864df29313caabe35593',
        },
        title: 'Smokey and the Bandit Part 3',
        year: '1983',
        id: '168',
      },
    ]),
  },
  {
    type: 'aggregation',
    databaseName: 'sample_airbnb',
    collectionName: 'listingsAndReviews',
    // TODO(COMPASS-7763): GPT-4 generates better results for this input.
    // When we've swapped over we can increase the accuracy for this test.
    // For now it will be giving low accuracy. gpt-3.5-turbo usually tries to
    // use $expr in a $project stage which is not valid syntax.
    minAccuracyForTest: 0,
    userInput:
      'what percentage of listings have a "Washer" in their amenities? Only consider listings with more than 2 beds. Return is as a string named "washerPercentage" like "75%", rounded to the nearest whole number.',
    assertResult: anyOf([
      isDeepStrictEqualTo([
        {
          _id: null,
          tvPercentage: '67%',
        },
      ]),
      isDeepStrictEqualTo([
        {
          tvPercentage: '67%',
        },
      ]),
    ]),
  },

  {
    type: 'query',
    databaseName: 'NYC',
    collectionName: 'parking_2015',
    // TODO(COMPASS-7763): GPT-4 generates better results for this input.
    // When we've swapped over we can increase the accuracy for this test.
    // For now it will be giving low accuracy.
    minAccuracyForTest: 0.5,
    userInput:
      'Write a query that does the following: "find all of the parking incidents that occurred on an ave (match all ways to write ave). Give me an array of all of the plate ids involved, in an object with their summons number and vehicle make and body type. Put the vehicle make and body type into lower case. No _id, sorted by the summons number lowest first.',
    assertResult: anyOf([
      isDeepStrictEqualTo([
        {
          'Summons Number': {
            $numberLong: '7093881087',
          },
          'Plate ID': 'FPG1269',
          'Vehicle Make': 'gmc',
          'Vehicle Body Type': 'subn',
        },
        {
          'Summons Number': {
            $numberLong: '7623830399',
          },
          'Plate ID': 'T645263C',
          'Vehicle Make': 'chevr',
          'Vehicle Body Type': 'subn',
        },
        {
          'Summons Number': {
            $numberLong: '7721537642',
          },
          'Plate ID': 'GMX1207',
          'Vehicle Make': 'honda',
          'Vehicle Body Type': '4dsd',
        },
        {
          'Summons Number': {
            $numberLong: '7784786281',
          },
          'Plate ID': 'DRW5164',
          'Vehicle Make': 'acura',
          'Vehicle Body Type': '4dsd',
        },
      ]),

      isDeepStrictEqualTo([
        {
          'Summons Number': 7093881087,
          'Plate ID': 'FPG1269',
          'Vehicle Make': 'gmc',
          'Vehicle Body Type': 'subn',
        },
        {
          'Summons Number': 7623830399,
          'Plate ID': 'T645263C',
          'Vehicle Make': 'chevr',
          'Vehicle Body Type': 'subn',
        },
        {
          'Summons Number': 7721537642,
          'Plate ID': 'GMX1207',
          'Vehicle Make': 'honda',
          'Vehicle Body Type': '4dsd',
        },
        {
          'Summons Number': 7784786281,
          'Plate ID': 'DRW5164',
          'Vehicle Make': 'acura',
          'Vehicle Body Type': '4dsd',
        },
      ]),
    ]),
  },
];

const meanAverage = (arr: number[]) =>
  arr.reduce((a: number, b: number) => a + b) / arr.length;

async function main() {
  try {
    await setup();
    const results: TestResult[] = [];

    const startTime = Date.now();
    let anyFailed = false;

    const testPromiseQueue = new PQueue({
      concurrency: TESTS_TO_RUN_CONCURRENTLY,
    });

    let hasUsageStats = false;

    tests.map((test) =>
      testPromiseQueue.add(async () => {
        const { accuracy, totalTestTimeMS, usageStats } = await runTest(test);

        if (usageStats) {
          hasUsageStats = true;
        }

        const minAccuracy = DEFAULT_MIN_ACCURACY;
        const failed = accuracy < (test.minAccuracyForTest ?? minAccuracy);

        results.push({
          Type: test.type.slice(0, 1).toUpperCase(),
          'User Input': test.userInput.slice(0, 50),
          Namespace: `${test.databaseName}.${test.collectionName}`,
          Accuracy: accuracy,
          'Time Elapsed (MS)': totalTestTimeMS,
          ...(usageStats
            ? {
                'Avg Prompt Tokens': meanAverage(
                  usageStats.map((usageStats) => usageStats.promptTokens)
                ),
                // 'Avg Completion Tokens': usageStats[0]?.completionTokens,
                'Avg Completion Tokens': meanAverage(
                  usageStats.map((usageStats) => usageStats.completionTokens)
                ),
              }
            : {}),
          Pass: failed ? '✗' : '✓',
        });

        anyFailed = anyFailed || failed;
      })
    );

    await testPromiseQueue.onIdle();

    console.table(results, [
      'Type',
      'User Input',
      'Namespace',
      'Accuracy',
      'Time Elapsed (MS)',
      ...(hasUsageStats ? ['Avg Prompt Tokens', 'Avg Completion Tokens'] : []),
      'Pass',
    ]);

    if (process.env.AI_ACCURACY_RESULTS_MONGODB_CONNECTION_STRING) {
      await pushResultsToDB({
        results,
        anyFailed,
        httpErrors: atlasBackend.httpErrors,
        runTimeMS: Date.now() - startTime,
      });
    }

    console.log('\nTotal HTTP errors received', atlasBackend.httpErrors);

    if (anyFailed) {
      process.exit(1);
    }
  } finally {
    await teardown();
  }
}

void main();
