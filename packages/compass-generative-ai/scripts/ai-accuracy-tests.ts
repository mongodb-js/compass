'use strict';

/* eslint-disable no-console */

// To run these tests against cloud-dev:
// > ATLAS_PUBLIC_KEY="..." \
//   ATLAS_PRIVATE_KEY="..." \
//   AI_TESTS_ATTEMPTS_PER_TEST=100 \
//     node scripts/ai-accuracy-tests/index.js

// To run these tests with local mms:
// First create an API key in your Atlas organization with
// the permissions "Organization Member".
// Then using that key run:
// > ATLAS_PUBLIC_KEY="..." \
//   ATLAS_PRIVATE_KEY="..." \
//   AI_TESTS_BACKEND=atlas-local \
//     node scripts/ai-accuracy-tests/index.js

import { MongoCluster } from 'mongodb-runner';
import { promises as fs } from 'fs';
import os from 'os';
import assert from 'assert';
import ejsonShellParser from 'ejson-shell-parser';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';
import type { Document } from 'bson';
import { getSimplifiedSchema } from 'mongodb-schema';
import path from 'path';
import util from 'util';
import { execFile as callbackExecFile } from 'child_process';
import DigestClient from 'digest-fetch';
import nodeFetch from 'node-fetch';
import decomment from 'decomment';

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

// p-queue has to be dynamically imported.
let PQueue: any;

const ATTEMPTS_PER_TEST = process.env.AI_TESTS_ATTEMPTS_PER_TEST
  ? +process.env.AI_TESTS_ATTEMPTS_PER_TEST
  : DEFAULT_ATTEMPTS_PER_TEST;

const USE_SAMPLE_DOCS = process.env.AI_TESTS_USE_SAMPLE_DOCS === 'true';

const BACKEND = process.env.AI_TESTS_BACKEND || 'atlas-dev';

type AITestError = Error & {
  errorCode?: string;
  status?: number;
  query?: string;
  prompt?: string;
  causedBy?: Error;
};

if (!['atlas-dev', 'atlas-local', 'compass'].includes(BACKEND)) {
  throw new Error('Unknown backend');
}

const fetch = (() => {
  if (BACKEND === 'atlas-dev' || BACKEND === 'atlas-local') {
    const ATLAS_PUBLIC_KEY = process.env.ATLAS_PUBLIC_KEY;
    const ATLAS_PRIVATE_KEY = process.env.ATLAS_PRIVATE_KEY;

    if (!(ATLAS_PUBLIC_KEY || ATLAS_PRIVATE_KEY)) {
      throw new Error('ATLAS_PUBLIC_KEY and ATLAS_PRIVATE_KEY are required.');
    }

    const client = new DigestClient(ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY, {
      algorithm: 'MD5',
    });

    return client.fetch.bind(client);
  }

  return nodeFetch;
})() as typeof nodeFetch;

const backendBaseUrl =
  process.env.AI_TESTS_BACKEND_URL ||
  (BACKEND === 'atlas-dev'
    ? 'https://cloud-dev.mongodb.com/api/private'
    : BACKEND === 'atlas-local'
    ? 'http://localhost:8080/api/private'
    : 'http://localhost:8080');

let httpErrors = 0;

type TestResult = {
  Type: string;
  'User Input': string;
  Namespace: string;
  Accuracy: number;
  // 'Prompt Tokens': usageStats[0]?.promptTokens,
  // 'Completion Tokens': usageStats[0]?.completionTokens,
  Pass: '✗' | '✓';
};

async function fetchAtlasPrivateApi(
  urlPath: string,
  init: Partial<Parameters<typeof fetch>[1]> = {}
) {
  const url = `${backendBaseUrl}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;

  return await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      'Content-Type': 'application/json',
      'User-Agent': 'Compass AI Accuracy tests',
    },
  })
    .then(async (res) => [res, await res.json()])
    .then(([res, data]) => {
      if (res.ok && data) {
        console.info(data);
        return data;
      }

      const errorCode = data?.errorCode || '-';

      const error: AITestError = new Error(
        `Request failed: ${res.status} - ${res.statusText}: ${errorCode}`
      );

      error.status = res.status;
      error.errorCode = errorCode;

      httpErrors++;

      return Promise.reject(error);
    });
}

type QueryOptions = {
  schema: any;
  collectionName: string;
  databaseName: string;
  sampleDocuments: Document[] | undefined;
  userInput: string;
};

function generateFindQuery(options: QueryOptions) {
  return fetchAtlasPrivateApi('/ai/api/v1/mql-query', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

function generateAggregation(options: QueryOptions) {
  return fetchAtlasPrivateApi('/ai/api/v1/mql-aggregation', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

const parseShellString = (shellSyntaxString?: string) => {
  if (shellSyntaxString === null || shellSyntaxString === undefined) {
    return shellSyntaxString;
  }

  const parsed = ejsonShellParser(decomment(shellSyntaxString));

  if (!parsed) {
    throw new Error(`Failed to parse shell syntax: \n"${shellSyntaxString}"`);
  }

  return parsed;
};

let cluster: MongoCluster;
let mongoClient: MongoClient;

const generateMQL = async ({
  type,
  databaseName,
  collectionName,
  userInput,
}: {
  type: string;
  databaseName: string;
  collectionName: string;
  userInput: string;
}) => {
  const collection = mongoClient.db(databaseName).collection(collectionName);
  const schema = await getSimplifiedSchema(collection.find());
  const sample = await collection.find().limit(2).toArray();

  if (type === 'aggregation') {
    return await generateAggregation({
      schema: schema,
      collectionName,
      databaseName,
      sampleDocuments: USE_SAMPLE_DOCS ? sample : undefined,
      userInput,
    });
  }

  return await generateFindQuery({
    schema: schema,
    collectionName,
    databaseName,
    sampleDocuments: USE_SAMPLE_DOCS ? sample : undefined,
    userInput,
  });
};

type UsageStats = { promptTokens: number; completionTokens: number };

type TestOptions = {
  type: string;
  databaseName: string;
  collectionName: string;
  userInput: string;
  assertResponse?: (responseContent: any) => Promise<void>;
  assertResult?: (responseContent: Document[]) => Promise<void> | void;
  acceptAggregationResponse?: boolean;
};

// eslint-disable-next-line complexity
const runOnce = async (
  {
    type,
    databaseName,
    collectionName,
    userInput,
    assertResponse,
    assertResult,
    acceptAggregationResponse,
  }: TestOptions,
  usageStats: UsageStats[]
) => {
  const response = await generateMQL({
    type,
    databaseName,
    collectionName,
    userInput,
  });

  usageStats.push({ promptTokens: 1, completionTokens: 1 });

  try {
    if (assertResponse) {
      await assertResponse(response.content);
    }

    const collection = mongoClient.db(databaseName).collection(collectionName);

    const aggregation = response?.content?.aggregation ?? {};
    const query = response?.content?.query ?? {};

    if (assertResult) {
      let cursor;

      if (
        type === 'aggregation' ||
        (type === 'query' &&
          acceptAggregationResponse &&
          aggregation.pipeline &&
          aggregation.pipeline !== '[]')
      ) {
        cursor = collection.aggregate(parseShellString(aggregation?.pipeline));
      } else {
        cursor = collection.find(parseShellString(query.filter));

        if (query.project) {
          cursor = cursor.project(parseShellString(query.project));
        }

        if (query.sort) {
          cursor = cursor.sort(parseShellString(query.sort));
        }

        if (query.limit) {
          cursor = cursor.limit(parseShellString(query.limit));
        }

        if (query.skip) {
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
    throw error;
  }
};

const runTest = async (testOptions: TestOptions) => {
  const usageStats: UsageStats[] = [];
  const attempts = ATTEMPTS_PER_TEST;
  let fails = 0;
  let timeouts = 0;
  let lastTestTimeMS = 0;

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

    try {
      console.info('---------------------------------------------------');
      console.info('Running', JSON.stringify(testOptions.userInput));
      console.info('Attempt', i + 1, 'of', attempts, 'Failures:', fails);
      await runOnce(testOptions, usageStats);

      console.info('OK');
    } catch (e: unknown) {
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

  return { accuracy, timeouts, usageStats };
};

const fixtures: {
  [dbName: string]: {
    [colName: string]: Document
  }
} = {};

async function setup() {
  // p-queue is ESM package only.
  PQueue = (await import('p-queue')).default;
  cluster = await MongoCluster.start({
    tmpDir: os.tmpdir(),
    topology: 'standalone',
  });

  mongoClient = new MongoClient(cluster.connectionString);

  const fixtureFiles = (
    await fs.readdir(path.join(__dirname, 'fixtures'), 'utf-8')
  ).filter((f) => f.endsWith('.json'));

  for (const fixture of fixtureFiles) {
    const fileContent = await fs.readFile(
      path.join(__dirname, 'fixtures', fixture),
      'utf-8'
    );

    const [db, coll] = fixture.split('.');

    const ejson = EJSON.parse(fileContent);

    fixtures[db] = { [coll]: EJSON.serialize(ejson.data) };

    await mongoClient.db(db).collection(coll).insertMany(ejson.data);

    if (ejson.indexes) {
      for (const index of ejson.indexes) {
        await mongoClient.db(db).collection(coll).createIndex(index);
      }
    }
  }
}

async function teardown() {
  await mongoClient?.close();
  await cluster?.close();
}

const isDeepStrictEqualTo = (expected: any) => (actual: any) =>
  assert.deepStrictEqual(actual, expected);

const isDeepStrictEqualToFixtures = (db: string, coll: string, comparator: (document: Document) => boolean) => (actual: any) => {
  const expected = fixtures[db][coll].filter(comparator);
  assert.deepStrictEqual(actual, expected);
};

const anyOf = (assertions: ((result: any) => void)[]) => (actual: any) => {
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
async function pushResultsToDB(results: TestResult[], anyFailed: boolean, httpErrors: number) {
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
      results: results,
    };

    await collection.insertOne(doc);
  } finally {
    await client.close();
  }
}

const tests = [
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
];
async function main() {
  try {
    await setup();
    const results: TestResult[] = [];

    let anyFailed = false;

    const testPromiseQueue = new PQueue({
      concurrency: TESTS_TO_RUN_CONCURRENTLY,
    });

    tests.map((test) =>
      testPromiseQueue.add(async () => {
        const {
          accuracy,
          // usageStats
        } = await runTest(test);
        const minAccuracy = DEFAULT_MIN_ACCURACY;
        const failed = accuracy < minAccuracy;

        results.push({
          Type: test.type.slice(0, 1).toUpperCase(),
          'User Input': test.userInput.slice(0, 50),
          Namespace: `${test.databaseName}.${test.collectionName}`,
          Accuracy: accuracy,
          // 'Prompt Tokens': usageStats[0]?.promptTokens,
          // 'Completion Tokens': usageStats[0]?.completionTokens,
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
      // 'Prompt Tokens',
      // 'Completion Tokens',
      'Pass',
    ]);

    if (process.env.AI_ACCURACY_RESULTS_MONGODB_CONNECTION_STRING) {
      await pushResultsToDB(results, anyFailed, httpErrors);
    }

    console.log('\nTotal HTTP errors received', httpErrors);

    if (anyFailed) {
      process.exit(1);
    }
  } finally {
    await teardown();
  }
}

void main();
