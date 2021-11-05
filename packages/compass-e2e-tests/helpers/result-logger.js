// @ts-check
const assert = require('assert');
const Mocha = require('mocha');

const debug = require('debug')('compass-e2e-tests:result-logger');

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
];

function joinPath(parts) {
  // Turn an array of test/hook path components into a string we can use as an
  // identifier for the test, hook or suite

  return parts.join(' / ');
}

function githubWorkflowRunUrl() {
  const serverURL = process.env.GITHUB_SERVER_URL;
  const repository = process.env.GITHUB_REPOSITORY;
  const runID = process.env.GITHUB_RUN_ID;

  return `${serverURL}/${repository}/actions/runs/${runID}`;
}

class ResultLogger {
  constructor(client, runner) {
    if (client) {
      debug(`Logging E2E test metrics to ${DB_NAME}.${COLLECTION_NAME}`);
      // client can be undefined if we don't want to write to the db
      this.client = client;
      const db = this.client.db(DB_NAME);
      this.collection = db.collection(COLLECTION_NAME);
    }

    // Things that have to resolve before we're done. ie. background database queries.
    this.promises = [];
    this.context = {};

    // copy known env vars as-is if they are set
    this.context.env = {};
    for (const name of ENV_VARS) {
      const value = process.env[name];
      if (value) {
        this.context.env[name] = value;
      }
    }

    // infer some common variables

    this.context.ci = process.env.EVERGREEN
      ? 'evergreen'
      : process.env.GITHUB_ACTIONS
      ? 'github-actions'
      : 'unknown';

    this.context.platform = process.platform;

    this.context.author =
      process.env.EVERGREEN_AUTHOR || process.env.GITHUB_ACTOR || 'unknown';

    this.context.branch =
      process.env.EVERGREEN_BRANCH_NAME ||
      process.env.GITHUB_HEAD_REF ||
      'unknown';

    // EVERGREEN_REVISION is the ${revision} expansion, but the ${github_commit} one might be better?
    // GITHUB_SHA also doesn't look 100% right.
    this.context.commit =
      process.env.EVERGREEN_REVISION || process.env.GITHUB_SHA || 'unknown';

    this.context.url = process.env.EVERGREEN
      ? process.env.EVERGREEN_TASK_URL
      : process.env.GITHUB_ACTIONS
      ? githubWorkflowRunUrl()
      : 'unknown';

    // Hooks and tests. See
    // https://github.com/evergreen-ci/evergreen/wiki/Project-Commands#attach-results
    // for the target structure.
    this.results = [];

    this.runner = runner;

    runner.on(EVENT_HOOK_BEGIN, (hook) => {
      this.promises.push(this.startResult(hook));
    });

    runner.on(EVENT_HOOK_END, (hook) => {
      // unlike for tests, with hooks end only fires when it passes
      this.promises.push(this.passResult(hook));
    });

    runner.on(EVENT_TEST_BEGIN, (test) => {
      this.promises.push(this.startResult(test));
    });

    runner.on(EVENT_TEST_PASS, (test) => {
      this.promises.push(this.passResult(test));
    });

    runner.on(EVENT_TEST_FAIL, (hookOrTest, error) => {
      // tests and hooks failing go to the same event
      if (hookOrTest.type === 'hook') {
        // NOTE: if this is a beforeEach hook, then the test's EVENT_TEST_BEGIN
        // will have fired but it will never get a corresponding
        // EVENT_TEST_FAIL, leaving it stuck in the start state
        this.promises.push(this.failResult(hookOrTest, error));
      } else {
        this.promises.push(this.failResult(hookOrTest, error));
      }
    });
  }

  async init() {
    debug('init');

    this.start = Date.now();
    if (this.collection) {
      const { insertedId } = await this.collection.insertOne({
        ...this.context,
        results: this.results,
        start: this.start,
        status: 'start',
      });
      this._id = insertedId;
      debug('resultId', this._id);
    }
  }

  async startResult(hookOrTest) {
    debug('start');

    const result = {
      test_file: joinPath(hookOrTest.titlePath()),
      start: Date.now(),
      status: 'start', // evergreen only knows fail, pass, silentfail and skip
    };

    this.results.push(result);

    if (this.collection) {
      await this.collection.updateOne(
        { _id: this._id },
        {
          $push: {
            results: result,
          },
        }
      );
    }
  }

  async passResult(hookOrTest) {
    debug('pass');

    const test_file = joinPath(hookOrTest.titlePath());
    const { result, index } = this.findResult(test_file);

    assert.ok(result);

    result.status = 'pass';
    result.end = Date.now();
    result.elapsed = result.end - result.start;

    if (this.collection) {
      await this.collection.updateOne(
        { _id: this._id },
        {
          $set: {
            [`results.${index}`]: result,
          },
        }
      );
    }
  }

  async failResult(hookOrTest, error) {
    debug('fail');

    const test_file = joinPath(hookOrTest.titlePath());
    const { result, index } = this.findResult(test_file);

    assert.ok(result);

    result.status = 'fail';
    result.end = Date.now();
    result.elapsed = result.end - result.start;
    result.error = error.stack;

    if (this.collection) {
      await this.collection.updateOne(
        { _id: this._id },
        {
          $set: {
            [`results.${index}`]: result,
          },
        }
      );
    }
  }

  async done(failures) {
    debug('done');

    await Promise.all(this.promises);

    this.end = Date.now();
    this.elapsed = this.end - this.start;

    if (this.collection) {
      const update = {
        elapsed: this.elapsed,
        status: failures ? 'fail' : 'pass',
        failures,
      };

      await this.collection.updateOne({ _id: this._id }, { $set: update });
    }

    return this.report();
  }

  report() {
    // TODO: change all results that are still stuck as "start" into "silentfail"
    // TODO: write a report.json to be uploaded to evergreen
    // TODO: we need execution and task_id

    return {};
  }

  findResult(test_file) {
    for (const [index, result] of this.results.entries()) {
      if (result.test_file === test_file) {
        return { result, index };
      }
    }

    return { result: null, index: -1 };
  }
}

module.exports = ResultLogger;
