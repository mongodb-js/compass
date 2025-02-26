import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import * as github from '@actions/github';
import createDebug from 'debug';

const GITHUB_OWNER = 'mongodb-js';
const GITHUB_REPO = 'compass';
const GITHUB_WORKFLOW_ID = 'test-installers.yml';
const MAX_GET_LATEST_ATTEMPTS = 10;
const WATCH_POLL_TIMEOUT_MS = 1000 * 60 * 60; // 1 hour

const debug = createDebug('compass:smoketests:dispatch');

function createNonce() {
  return crypto.randomBytes(8).toString('hex');
}

async function getWorkflowRun(
  octokit: ReturnType<typeof github.getOctokit>,
  expectedRunName: string
) {
  const {
    data: { workflow_runs: workflowRuns },
  } = await octokit.rest.actions.listWorkflowRuns({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    workflow_id: GITHUB_WORKFLOW_ID,
  });
  return workflowRuns.find((run) => run.name === expectedRunName);
}

async function getWorkflowRunRetrying(
  octokit: ReturnType<typeof github.getOctokit>,
  expectedRunName: string,
  pollDelayMs = 1000
) {
  for (let attempt = 0; attempt < MAX_GET_LATEST_ATTEMPTS; attempt++) {
    const run = await getWorkflowRun(octokit, expectedRunName);
    debug(`Attempt %d finding run named "%s"`, attempt, expectedRunName);
    if (run) {
      return run;
    }
    await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
  }
  throw new Error(
    `Failed to find run with name "${expectedRunName}" after ${MAX_GET_LATEST_ATTEMPTS} attempts`
  );
}

type RefFromGithubPrOptions = {
  githubToken: string;
  githubPrNumber: number;
};

export async function getRefFromGithubPr({
  githubToken,
  githubPrNumber,
}: RefFromGithubPrOptions) {
  const octokit = github.getOctokit(githubToken);
  const {
    data: {
      head: { ref },
    },
  } = await octokit.rest.pulls.get({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    pull_number: githubPrNumber,
  });
  console.log(`Got ref "${ref}" from PR #${githubPrNumber}`);
  return ref;
}

type PollToCompletionOptions = {
  octokit: ReturnType<typeof github.getOctokit>;
  runId: number;
  watchTimeoutMs: number;
  watchPollDelayMs: number;
};

async function pollToCompletion({
  octokit,
  runId,
  watchTimeoutMs,
  watchPollDelayMs,
}: PollToCompletionOptions): Promise<string> {
  for (
    const start = new Date();
    new Date().getTime() - start.getTime() < watchTimeoutMs;

  ) {
    const {
      data: { status, conclusion },
    } = await octokit.rest.actions.getWorkflowRun({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      run_id: runId,
    });
    console.log(`Status: ${status || 'null'}`);
    if (status === 'completed') {
      assert(
        typeof conclusion === 'string',
        'Expected conclusion when completed'
      );
      return conclusion;
    }
    await new Promise((resolve) => setTimeout(resolve, watchPollDelayMs));
  }

  // Cancel the run before timing out
  await octokit.rest.actions.cancelWorkflowRun({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    run_id: runId,
  });
  return 'timeout';
}

type DispatchOptions = {
  githubToken: string;
  ref: string;
  bucketName: string;
  bucketKeyPrefix: string;
  devVersion?: string;
  evergreenTaskUrl?: string;

  /**
   * Delay in milliseconds to wait between requests when polling while watching the run.
   */
  watchPollDelayMs?: number | undefined;
};

export async function dispatchAndWait({
  githubToken,
  ref,
  devVersion,
  bucketName,
  bucketKeyPrefix,
  evergreenTaskUrl,
  watchPollDelayMs = 5000,
}: DispatchOptions) {
  const octokit = github.getOctokit(githubToken);
  const nonce = createNonce();
  // Dispatch
  await octokit.rest.actions.createWorkflowDispatch({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    workflow_id: GITHUB_WORKFLOW_ID,
    ref,
    inputs: {
      dev_version: devVersion,
      bucket_name: bucketName,
      bucket_key_prefix: bucketKeyPrefix,
      evergreen_task_url: evergreenTaskUrl,
      nonce,
    },
  });

  // Find the next run we just dispatched
  const run = await getWorkflowRunRetrying(
    octokit,
    `Test Installers ${devVersion || ref} / (nonce = ${nonce})`
  );

  console.log(`Dispatched run #${run.run_number} (${run.html_url})`);
  const status = await pollToCompletion({
    octokit,
    runId: run.id,
    watchTimeoutMs: WATCH_POLL_TIMEOUT_MS,
    watchPollDelayMs,
  });

  console.log(`Run completed: ${run.html_url}`);
  assert.equal(status, 'success', "Expected a 'success' conclusion");
}
