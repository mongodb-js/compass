#!/usr/bin/env node
import { getOctokit, context } from '@actions/github';

// Posts or updates a PR comment listing newly detected feature flags.
// Invoked from the feature-flag-mms-pr.yml workflow.

async function main(): Promise<void> {
  const marker = '<!-- feature-flag-mms-comment -->';
  const outdatedMarker = '<!-- feature-flag-mms-comment-outdated -->';
  const flagsCount = process.env.FLAGS_COUNT;
  const hasFlags = flagsCount !== '' && flagsCount !== '0';

  const github = getOctokit(process.env.GITHUB_TOKEN || '');

  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
  });

  const existing = comments.find((c) => c.body?.includes(marker));

  // No new feature flags and no existing comment: nothing to do.
  if (!existing && !hasFlags) {
    return;
  }

  // New flag and no existing comment: create a new comment.
  if (hasFlags && !existing) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: marker + '\n' + process.env.COMMENT_BODY,
    });
    return;
  }

  // New flag and existing comment: update the existing comment.
  if (hasFlags && existing) {
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body: marker + '\n' + process.env.COMMENT_BODY,
    });
    return;
  }

  // No flag, but existing comment: mark the comment as outdated.
  if (!hasFlags && existing && !existing.body?.includes(outdatedMarker)) {
    const previous = existing.body?.replace(marker, '').trim();
    const body =
      marker +
      '\n' +
      outdatedMarker +
      '\n' +
      '> [!NOTE]\n' +
      '> The new feature flag(s) originally detected in this PR are no longer ' +
      'present in the latest commits, so this notice no longer applies.\n\n' +
      '<details><summary>Previous message</summary>\n\n' +
      previous +
      '\n\n</details>';
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body,
    });
    return;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
