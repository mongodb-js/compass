---
name: evergreen-cli
description: Run, inspect, and debug Compass CI on Evergreen from the terminal. Use when asked to submit a patch build, rerun failed tasks, pull task logs or e2e artifacts, check the last green commit, or validate .evergreen config. Triggers on "evergreen", "evg", "patch build", "spruce", "task log", "fetch artifacts", "last green".
---

# Evergreen CLI for Compass

Project: `10gen-compass-main`. UI: `https://spruce.corp.mongodb.com`.
Verified against `evergreen` CLI version 2026-08-28. Run `evergreen <cmd> --help` if a flag below is rejected.

## Setup (once)

```bash
evergreen login            # OIDC via browser; add --no-browser on a remote box
evergreen get-update       # keep the binary current
```

Config lives in `~/.evergreen.yml`. The CLI maps directories to projects under `projects_for_directory`, so inside the Compass checkout (including `.claude/worktrees/*`) you can omit `-p`. The first run from a new directory prompts and offers to save the mapping.

## Submit a patch build

Always scope to what you touched. `--variants all --tasks all` costs hours of machine time.

```bash
# Committed changes on the current branch, pick variants and tasks by name
evergreen patch -v test-server-80x-enterprise-1 -t test-server-80x-enterprise-1 -f -y -d "COMPASS-1234 repro"

# Include uncommitted work
evergreen patch -u -v unit-tests-ubuntu -t test -f -y --ad

# Regex selection (prefer this for the sharded e2e variants)
evergreen patch --rv 'test-web-sandbox-chrome-.*' --rt 'test-web-sandbox-chrome-.*' -f -y -d "chrome e2e"

# Rerun exactly the failed tasks of your latest patch
evergreen patch --rf -f -y

# Rerun the same selection as a specific patch
evergreen patch --repeat-patch <patch_id> -f -y

# Pin the Atlas Cloud env for the atlas-cloud e2e variants (default is dev)
evergreen patch --rv 'test-web-sandbox-atlas-cloud-.*' --rt 'test-web-sandbox-atlas-cloud-.*' \
  --param compass_web_publish_environment=qa -f -y -d "atlas-cloud on qa"
```

Flag cheat sheet:

| Flag                | Meaning                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `-v` / `-t`         | variant / task names, repeatable, `all` allowed                                                                |
| `--rv` / `--rt`     | regex variant / task                                                                                           |
| `-f`                | finalize: schedule immediately. Without it the patch sits unscheduled until `evergreen finalize-patch -i <id>` |
| `-u`                | include uncommitted changes                                                                                    |
| `-y`                | skip confirmation                                                                                              |
| `-d` / `--ad`       | description / use last commit message                                                                          |
| `--param KEY=VALUE` | project parameter, see below                                                                                   |
| `--ref <sha>`       | test a commit other than HEAD                                                                                  |
| `--browse`          | open Spruce when done                                                                                          |
| `--json`            | machine-readable output, suppresses prompts                                                                    |

Diffs larger than 16MB need `--large`.

Discover names without opening Spruce:

```bash
# `evergreen list -f .evergreen.yml` fails here because the config uses `include:`;
# read the generated file directly instead
grep -E '^  - name:' .evergreen/buildvariants-and-tasks.yml | sort -u
evergreen list --parameters -p 10gen-compass-main
evergreen list --patch-aliases --include-config-aliases -p 10gen-compass-main
```

Project parameters:

| Parameter                         | Default | Purpose                                                                                                   |
| --------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `compass_web_publish_environment` | `dev`   | Atlas Cloud env used by publish-web and the atlas-cloud e2e tasks (`COMPASS_E2E_ATLAS_CLOUD_ENVIRONMENT`) |
| `compass_web_release_commit`      | empty   | exact commit to deploy as latest for that env                                                             |

PRs do not need a manual patch. `github_pr_aliases` in `.evergreen.yml` runs every task of every variant tagged `run-on-pr` on each PR push.

## Watch and manage patches

```bash
evergreen list-patches -n 5           # your latest patches, status and Spruce link
evergreen list-patches -n 5 -s        # with a diff summary
evergreen list-patches -i <patch_id>  # one patch
evergreen finalize-patch -i <patch_id>
evergreen cancel-patch   -i <patch_id>
```

Spruce URLs: version page is `/version/<patch_id>`, task page is `/task/<task_id>`. Copy the task id from the task page URL for the commands below.

## Pull logs and artifacts

```bash
# Last 500 lines of the task log, with timestamps
evergreen task build TaskLogs --task_id <task_id> --type task_log -n 500 --print_time

# Full task log to a file, specific execution (0-based)
evergreen task build TaskLogs --task_id <task_id> --execution 1 --type task_log -o task.log

# Test-level log by path (path shown in the Spruce test results tab)
evergreen task build TestLogs --task_id <task_id> --log_path <path> -o test.log

# All artifacts of one task into ./artifacts (no Spruce auth needed)
evergreen fetch --task <task_id> --artifacts --shallow -d ./artifacts

# Clone the source exactly as the task saw it
evergreen fetch --task <task_id> --source -d ./task-src
```

For e2e tasks the useful artifact is `all-e2e-logs.tgz`. It contains per-test screenshots (written only on failure), app and renderer logs, and chromedriver logs. It is far more informative than the task log tail.

## Find a good baseline

```bash
evergreen last-green -v unit-tests-ubuntu -v test-server-80x-enterprise-1 -p 10gen-compass-main
```

Returns the most recent mainline version where all listed variants passed. Use it to bisect flaky-vs-broken.

## Edit CI config

Follow `.evergreen/AGENTS.md`. Short version:

```bash
# edit .evergreen/buildvariants-and-tasks.in.yml, never the generated .yml
npm run update-evergreen-config   # regenerates and runs `evergreen validate .evergreen.yml`
evergreen evaluate -f .evergreen.yml --variants   # see the fully expanded result
```

Commit the regenerated `.yml` with the template change. Verify with a patch build limited to the variants you touched. Task hard cap is `exec_timeout_secs: 5400` (90 min).

## Triage notes specific to Compass

- `test-web-sandbox-atlas-cloud-{1,2,3}` are chronically red for environment reasons (cluster provisioned but unreachable, BiDi timeouts, 16-minute `waitFor` timeouts turning one missing element into a dead task). Check for those signatures before blaming the branch. Tracked in COMPASS-11224.
- Build Baron is not onboarded for this project, so there is no known-failure linkage. Use task history and reliability instead: in Spruce, or via the Evergreen MCP tools (`evg_get_task_history`, `evg_get_task_reliability`, `evg_debug_task`) when working with Claude.
- A failing patch for a GitHub PR shows up in `list-patches` with the PR number and author in the description, so you can find it without Spruce.
