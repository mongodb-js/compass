---
name: debug-ci
description: Diagnose failed Compass CI, both GitHub Actions and Evergreen. Use when given a failed run/patch/task URL or ID, a folder of downloaded CI logs, or asked "why did CI fail", "is this flaky", "what broke the build". Finds the real error under log noise, ties it to the config in this repo, and proposes a fix.
---

# Compass CI failure debugging

Compass CI is split in two. Pick the system first:

| Failing thing                                                | System                                                                  | Start at  |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | --------- |
| `.github/workflows/*` (release, publish, bump/update PRs)    | GitHub Actions                                                          | section 1 |
| Unit/e2e/package tests and builds on a PR or `main` | Evergreen | section 2 |
| Installer smoke tests (`smoketest-packaged-app`) | Evergreen dispatches `.github/workflows/test-installers.yml` | section 2, then section 1 using the dispatched run URL in the task log |
| Unsure                                                       | check PR checks: `gh pr checks <pr>` shows which system owns each check | both      |

Never read a whole log (100k+ lines happens). Search for the error, then read a small window. Truncate long lines (`cut -c1-300`) and never print tokens or env dumps. Write scratch output to `/tmp`, not the repo.

## 1. GitHub Actions

Get the failure (read-only `gh`, no download needed):

```bash
gh run view <run_id> -R mongodb-js/compass --json conclusion,event,headSha,workflowName,jobs \
  --jq '{conclusion,event,headSha,workflowName,failed:[.jobs[]|select(.conclusion=="failure")|.name]}'
gh run view <run_id> -R mongodb-js/compass --log-failed > /tmp/ci-<run_id>.log
gh run list -R mongodb-js/compass --workflow <file.yml> --limit 10   # is it failing every time?
```

Pasted URL `.../actions/runs/<id>/job/<job_id>` works the same; use the run id. For downloaded log folders (`N_<job>.txt` plus `<job>/system.txt`), use the same greps on those files; `system.txt` shows `if:` evaluation and runner pickup.

Find the signal:

```bash
grep -n -E "##\[error\]|Process completed with exit code|fatal:|npm ERR!|Error:|FAIL " /tmp/ci-<run_id>.log | cut -c1-300 | head -40
grep -n "##\[group\]" /tmp/ci-<run_id>.log | cut -c1-160     # step boundaries
sed -n '<first_error_line-40>,<first_error_line+5>p' /tmp/ci-<run_id>.log | cut -c1-300
```

Then read the workflow named in the log (`Job defined at: .../<file>.yml`) and `git log --oneline -5 -- <file>`. Some workflows here use a GitHub App token against another org repo (`10gen/mms`, etc.), so permissions, branch/ref conflicts and rulesets can be a common cause. When a third-party action hides the cause (e.g. `Reference update failed`), state a hypothesis and confirm it with read-only `gh api` calls (branches, `git/matching-refs`, `gh pr list --search`, rulesets). Check dates: a merge or branch deletion between the run and now can hide the condition that caused the failure.

## 2. Evergreen

Project `10gen-compass-main`, UI `https://spruce.corp.mongodb.com`. PRs run every task of every `run-on-pr` variant automatically (`github_pr_aliases` in `.evergreen.yml`). Config source is `.evergreen/buildvariants-and-tasks.in.yml` (never edit the generated `.yml`); see `.evergreen/AGENTS.md`.

IDs: version/patch page `/version/<patch_id>`, task page `/task/<task_id>`. Both are in the Spruce URL.

Prefer the Evergreen MCP tools when available (broad to narrow; do not skip steps):

1. `list_user_recent_patches_evergreen`: find the patch (PR patches carry the PR number in the description).
2. `get_patch_failed_jobs_evergreen` (patch_id): failed tasks and variants.
3. `get_task_test_results_evergreen` (task_id): which tests failed.
4. `get_task_logs_evergreen` (task_id): the log for one task.

No MCP? Use the CLI, see `.agents/skills/evergreen-cli/SKILL.md` for setup and flags:

```bash
evergreen list-patches -n 5
evergreen task build TaskLogs --task_id <task_id> --type task_log -n 500 --print_time
evergreen task build TaskLogs --task_id <task_id> --type task_log -o /tmp/task.log
evergreen fetch --task <task_id> --artifacts --shallow -d /tmp/artifacts
```

Notes:

- For e2e tasks the artifact `all-e2e-logs.tgz` (screenshots on failure, app/renderer/chromedriver logs) beats the task log tail.
- Find the first failing command/test, not the last line. Hard cap per task is 90 minutes (`exec_timeout_secs: 5400`); a timeout usually means one earlier hang.
- Known-red: `test-web-sandbox-atlas-cloud-{1,2,3}` fail for environment reasons (unreachable cluster, BiDi timeouts, long `waitFor`). Check those signatures before blaming the branch.
- Flaky vs broken: compare with the baseline (`evergreen last-green -v <variant> -p 10gen-compass-main`), or task history/reliability (`evg_get_task_history`, `evg_get_task_reliability` if exposed). Same task passing on a recent mainline commit and failing on yours points at your branch.
- Map the failing test to code: grep the test name in `packages/*`, then `git log -5 -- <path>` and compare with the PR diff.

## 3. Classify

- **Our change**: deterministic failure tied to the diff (test, lint, type, snapshot).
- **Config/workflow bug**: bad expression, naming, permissions, pinned action, `.evergreen` template.
- **Flaky/external**: network, registry, rate limit, runner provisioning, known-red tasks. A re-run of the same SHA passing confirms it.

## 4. Report

- Root cause in a few lines with log line numbers or task/test names as evidence.
- Confidence: confirmed vs hypothesis, plus the exact read-only command that would confirm it.
- Proposed fix as a diff; apply only if asked.
- Noise note: what made the log hard to read and how to reduce it.

## Boundaries

Read-only by default. Do not re-run workflows or patches, cancel anything, or call mutating `gh api` methods (POST/PUT/PATCH/DELETE) without asking. Submitting a patch is covered by `evergreen-cli` and needs the user's go-ahead. Do not run lint/typecheck/build unless asked.
