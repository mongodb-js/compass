// @ts-check
const Mocha = require('mocha');

const debug = require('debug')('compass-e2e-tests:db-logger');

const DB_NAME = 'compass_e2e';
const COLLECTION_NAME = 'results';

const {
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS
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

class DBLogger {
  constructor(client, runner) {
    this.client = client;
    const db = this.client.db(DB_NAME);
    this.collection = db.collection(COLLECTION_NAME);

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

    this.context.ci = process.env.EVERGREEN ? 'evergreen'
      : process.env.GITHUB_ACTIONS ? 'github-actions'
      : 'unknown';

    this.context.platform = process.platform;

    this.context.author = process.env.EVERGREEN_AUTHOR || process.env.GITHUB_ACTOR || 'unknown';

    this.context.branch = process.env.EVERGREEN_BRANCH_NAME || process.env.GITHUB_REF || 'unknown';

    // EVERGREEN_REVISION is the ${revision} expansion, but the ${github_commit} one might be better?
    this.context.commit = process.env.EVERGREEN_REVISION || process.env.GITHUB_SHA || 'unknown';

    this.context.url = process.env.EVERGREEN ? process.env.EVERGREEN_TASK_URL
      : process.env.GITHUB_ACTIONS ? githubWorkflowRunUrl()
      : 'unknown';

    this.steps = []; // hooks and tests

    this.runner = runner;

    runner.on(EVENT_HOOK_BEGIN, (hook) => {
      this.logPossibleError(this.start('hook', hook));
    });

    runner.on(EVENT_HOOK_END, (hook) => {
      // unlike for tests, with hooks end only fires when it passes
      this.logPossibleError(this.succeed('hook', hook));
    });

    runner.on(EVENT_TEST_BEGIN, (test) => {
      this.logPossibleError(this.start('test', test));
    });

    runner.on(EVENT_TEST_PASS, (test) => {
      this.logPossibleError(this.succeed('test', test));
    });

    runner.on(EVENT_TEST_FAIL, (hookOrTest, error) => {
      // tests and hooks failing go to the same event
      if (hookOrTest.type === 'hook') {
        // NOTE: if this is a beforeEach hook, then the test's EVENT_TEST_BEGIN
        // will have fired but it will never get a corresponding
        // EVENT_TEST_FAIL, leaving it stuck in the started state
        this.logPossibleError(this.fail('hook', hookOrTest, error));
      }
      else {
        this.logPossibleError(this.fail('test', hookOrTest, error));
      }
    });
  }

  async init() {
    this.started = Date.now();
    debug('init');
    const { insertedId } = await this.collection.insertOne({
      ...this.context,
      steps: this.steps,
      started: this.started,
      status: 'started',
    });
    this._id = insertedId;
  }

  async logPossibleError(promise) {
    try {
      await promise;
    }
    catch (err) {
      // We're writing to the db from event handlers and nothing will await those promises. If they fail, just log.
      console.error(err.stack);
    }
  }

  async start(type, hookOrTest) {
    const step = {
      type,
      title: joinPath(hookOrTest.titlePath()),
      started: Date.now(),
      status: 'started'
    };
    this.steps.push(step);
    debug('start');
    await this.collection.updateOne(
      { _id: this._id },
      {
        $push: {
          steps: step
        }
      }
    );
  }

  async succeed(type, hookOrTest) {
    const title = joinPath(hookOrTest.titlePath());
    const { step, index } = this.findStep(type, title);

    if (!step) {
      console.log('unable to find', type, title);
      return;
    }

    step.status = 'succeeded';
    step.duration = Date.now() - step.started;
    debug('succeed');
    await this.collection.updateOne(
      { _id: this._id },
      {
          $set: {
            [`steps.${index}`]: step
        }
      }
    );
  }

  async fail(type, hookOrTest, error) {
    const title = joinPath(hookOrTest.titlePath());
    const { step, index } = this.findStep(type, title);

    if (!step) {
      console.log('unable to find', type, title);
      return;
    }

    step.status = 'failed';
    step.duration = Date.now() - step.started;
    step.error = error.stack;
    debug('fail');
    await this.collection.updateOne(
      { _id: this._id },
      {
        $set: {
          [`steps.${index}`]: step
        }
      }
    );
  }

  async done(failures) {
    debug('done');
    if (failures) {
      await this.collection.updateOne(
        { _id: this._id },
        {
          $set: {
              status: 'failed',
              duration: Date.now() - this.started,
              failures
          }
        }
      );
    }
    else {
      await this.collection.updateOne(
        { _id: this._id },
        {
          $set: {
              status: 'succeeded',
              duration: Date.now() - this.started
          }
        }
      );
    }
  }

  findStep(type, title) {
    for (const [index, step] of this.steps.entries()) {
      if (step.type === type && step.title === title) {
        return { step, index };
      }
    }

    return { step: null, index: -1 };
  }
}

module.exports = DBLogger;
