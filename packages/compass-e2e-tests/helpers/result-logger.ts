import assert from 'assert';
import Debug from 'debug';
import Mocha from 'mocha';
import type { MongoClient, Collection } from 'mongodb';
import type { ObjectId } from 'bson';

const debug = Debug('result-logger');

const DB_NAME = 'compass_e2e';
const COLLECTION_NAME = 'results';

const {
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
} = Mocha.Runner.constants;

// env vars to store with the metrics. Be careful not to include secrets.
const ENV_VARS = [
  'CI',

  // evergreen
  'EVERGREEN_AUTHOR',
  'EVERGREEN_BRANCH_NAME',
  'EVERGREEN_BUILD_ID',
  'EVERGREEN_BUILD_VARIANT',
  'EVERGREEN_EXECUTION',
  'EVERGREEN_IS_PATCH',
  'EVERGREEN_PROJECT',
  'EVERGREEN_REVISION',
  'EVERGREEN_TASK_ID',
  'EVERGREEN_TASK_NAME',
  'EVERGREEN_TASK_URL',
  'EVERGREEN_VERSION_ID',
  'EVERGREEN_WORKDIR',

  // github
  'GITHUB_WORKFLOW',
  'GITHUB_RUN_ID',
  'GITHUB_RUN_NUMBER',
  'GITHUB_JOB',
  'GITHUB_ACTION',
  'GITHUB_ACTION_PATH',
  'GITHUB_ACTIONS',
  'GITHUB_ACTOR',
  'GITHUB_REPOSITORY',
  'GITHUB_EVENT_NAME',
  'GITHUB_EVENT_PATH',
  'GITHUB_WORKSPACE',
  'GITHUB_SHA',
  'GITHUB_REF',
  'GITHUB_HEAD_REF',
  'GITHUB_BASE_REF',
  'GITHUB_SERVER_URL',
  'GITHUB_API_URL',
  'GITHUB_GRAPHQL_URL',
  'RUNNER_NAME',
  'RUNNER_OS',
  'RUNNER_TEMP',
  'RUNNER_TOOL_CACHE',
] as const;

type Env = { [K in typeof ENV_VARS[number]]?: string };

type HookOrTest = Mocha.Hook | Mocha.Test;

function joinPath(parts: string[]) {
  // Turn an array of test/hook path components into a string we can use as an
  // identifier for the test, hook or suite

  return parts.join(' / ');
}

function githubWorkflowRunUrl() {
  const serverURL = process.env.GITHUB_SERVER_URL ?? '';
  const repository = process.env.GITHUB_REPOSITORY ?? '';
  const runID = process.env.GITHUB_RUN_ID ?? '';

  return `${serverURL}/${repository}/actions/runs/${runID}`;
}

type Result = {
  test_file: string;
  type?: string; // tests don't have types and we delete these before handing it to evergreen
  start: number;
  status: 'start' | 'pass' | 'fail' | 'silentfail';
  end?: number;
  elapsed?: number;
  error?: any;
  task_id?: string;
  execution?: number;
};

type Report = {
  results: Result[];
};

export default class ResultLogger {
  _id?: ObjectId;
  start?: number;
  end?: number;
  elapsed?: number;
  client?: MongoClient;
  collection?: Collection;
  context: {
    env: Env;
    ci: 'evergreen' | 'github-actions' | 'unknown';
    platform: string;
    os: string;
    author: string;
    branch: string;
    commit: string;
    url: string;
  };
  results: Result[];
  runner: Mocha.Runner;

  constructor(client: MongoClient, runner: Mocha.Runner) {
    if (client) {
      debug(`Logging E2E test metrics to ${DB_NAME}.${COLLECTION_NAME}`);
      // client can be undefined if we don't want to write to the db
      this.client = client;
      const db = this.client.db(DB_NAME);
      this.collection = db.collection(COLLECTION_NAME);
    }

    this.context = {
      // copy known env vars as-is if they are set
      env: ENV_VARS.reduce((obj: Env, name: keyof Env) => {
        const value = process.env[name];
        if (value) {
          obj[name] = value;
        }
        return obj;
      }, {}),

      // infer some common variables
      ci: process.env.EVERGREEN
        ? 'evergreen'
        : process.env.GITHUB_ACTIONS
        ? 'github-actions'
        : 'unknown',

      platform: process.platform,

      // this way we should be able to distinguish between ubuntu and rhel on
      // evergreen and linux on github actions
      os:
        process.env.EVERGREEN_BUILD_VARIANT ??
        process.env.RUNNER_OS ??
        'unknown',

      author:
        process.env.EVERGREEN_AUTHOR ?? process.env.GITHUB_ACTOR ?? 'unknown',

      // For an evergreen patch the branch name is set to main which is not what we want
      branch: process.env.EVERGREEN_IS_PATCH
        ? 'evergreen-patch'
        : process.env.EVERGREEN_BRANCH_NAME ??
          process.env.GITHUB_HEAD_REF ??
          'unknown',

      // EVERGREEN_REVISION is the ${revision} expansion, but the ${github_commit} one might be better?
      // GITHUB_SHA also doesn't look 100% right.
      commit:
        process.env.EVERGREEN_REVISION ?? process.env.GITHUB_SHA ?? 'unknown',

      url: process.env.EVERGREEN
        ? process.env.EVERGREEN_TASK_URL ?? ''
        : process.env.GITHUB_ACTIONS
        ? githubWorkflowRunUrl()
        : 'unknown',
    };

    // Hooks and tests. See
    // https://github.com/evergreen-ci/evergreen/wiki/Project-Commands#attach-results
    // for the target structure.
    this.results = [];

    this.runner = runner;

    runner.on(EVENT_HOOK_BEGIN, (hook) => {
      this.startResult(hook);
    });

    runner.on(EVENT_HOOK_END, (hook) => {
      // unlike for tests, with hooks end only fires when it passes
      this.passResult(hook);
    });

    runner.on(EVENT_TEST_BEGIN, (test) => {
      this.startResult(test);
    });

    runner.on(EVENT_TEST_PASS, (test) => {
      this.passResult(test);
    });

    runner.on(EVENT_TEST_FAIL, (hookOrTest: HookOrTest, error: any) => {
      // tests and hooks failing go to the same event
      if (hookOrTest.type === 'hook') {
        // NOTE: if this is a beforeEach hook, then the test's EVENT_TEST_BEGIN
        // will have fired but it will never get a corresponding
        // EVENT_TEST_FAIL, leaving it stuck in the start state
        this.failResult(hookOrTest, error);
      } else {
        this.failResult(hookOrTest, error);
      }
    });
  }

  async init(): Promise<void> {
    debug('init');

    this.start = Date.now() / 1000;
    if (this.collection) {
      const { insertedId } = await this.collection.insertOne({
        ...this.context,
        start: this.start,
        status: 'start',
      });
      this._id = insertedId;
      debug('resultId', this._id);
    }
  }

  startResult(hookOrTest: HookOrTest): void {
    const test_file = joinPath(hookOrTest.titlePath());
    debug('start', test_file);

    const result = {
      test_file,
      type: hookOrTest.type,
      start: Date.now() / 1000,
      status: 'start', // evergreen only knows fail, pass, silentfail and skip
    } as Result;

    this.results.push(result);
  }

  passResult(hookOrTest: HookOrTest): void {
    const test_file = joinPath(hookOrTest.titlePath());
    debug('pass', test_file);
    const result = this.findResult(test_file);

    assert.ok(result);

    result.status = 'pass';
    result.end = Date.now() / 1000;
    result.elapsed = result.end - result.start;
  }

  failResult(hookOrTest: HookOrTest, error: Error): void {
    const test_file = joinPath(hookOrTest.titlePath());
    debug('fail', test_file);
    const result = this.findResult(test_file);

    assert.ok(result);

    result.status = 'fail';
    result.end = Date.now() / 1000;
    result.elapsed = result.end - result.start;
    result.error = error.stack;
  }

  async done(failures: number): Promise<Report> {
    debug('done');

    this.end = Date.now() / 1000;
    this.elapsed = this.end - (this.start || 0); // typescript thinks start might be undefined

    if (this.collection) {
      const update = {
        results: this.results,
        elapsed: this.elapsed,
        status: failures ? 'fail' : 'pass',
        failures,
      };

      await this.collection.updateOne({ _id: this._id }, { $set: update });
    }

    return this.report();
  }

  report(): Report {
    const results = this.results
      .filter((r) => {
        if (r.status !== 'pass') {
          // keep all errors
          return true;
        }
        // strip out passed hooks because it is a bit noisy
        if (r.type === 'hook') {
          return false;
        }
        return true;
      })
      .map((r) => {
        const result = { ...r };
        // change things that are still stuck as "start" to something evergreen
        // understands
        if (result.status === 'start') {
          result.status = 'silentfail';
        }

        // copy over some evergreen-specific fields if they exist
        if (process.env.EVERGREEN_TASK_ID) {
          result.task_id = process.env.EVERGREEN_TASK_ID;
        }
        if (process.env.EVERGREEN_EXECUTION) {
          result.execution = parseInt(process.env.EVERGREEN_EXECUTION, 10);
        }

        if (result.type) {
          delete result.type;
        }

        // only include fields that evergreen knows about
        // https://github.com/evergreen-ci/evergreen/wiki/Project-Commands#attach-results
        delete result.error;

        return result;
      });

    return { results };
  }

  findResult(test_file: string): Result | null {
    for (const result of this.results) {
      if (result.test_file === test_file) {
        return result;
      }
    }

    return null;
  }
}
