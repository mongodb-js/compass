#!/usr/bin/env node
import { getOctokit, context } from '@actions/github';

// Warns on a PR when the package-lock.json diff is unexpectedly large.
// Invoked from the check-package-lock-diff.yml workflow.

const marker = '<!-- package-lock-diff-comment -->';
const outdatedMarker = '<!-- package-lock-diff-comment-outdated -->';

async function main(): Promise<void> {
  const threshold = Number(process.env.THRESHOLD);
  const github = getOctokit(process.env.GITHUB_TOKEN || '');

  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.issue.number,
    per_page: 100,
  });

  const lockFiles = files.filter(
    (f) =>
      f.filename === 'package-lock.json' ||
      f.filename.endsWith('/package-lock.json')
  );
  const changes = lockFiles.reduce(
    (sum, f) => sum + f.additions + f.deletions,
    0
  );
  const exceedsThreshold = changes > threshold;

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    per_page: 100,
  });

  const existing = comments.find(
    (c) => c.user?.login === 'github-actions[bot]' && c.body?.includes(marker)
  );

  // Below the threshold and no existing comment: nothing to do.
  if (!existing && !exceedsThreshold) {
    return;
  }

  if (exceedsThreshold) {
    const breakdown = lockFiles
      .map((f) => `> - \`${f.filename}\`: +${f.additions} / -${f.deletions}`)
      .join('\n');
    const body = `${marker}
> [!WARNING]
> This PR changes **${changes}** lines in package-lock.json (threshold: ${threshold}).
>
${breakdown}
>
> Adding or updating a dependency should rarely produce a diff this large. Please double check the lockfile changes are intentional - a common cause is running a different npm or Node.js version than the one the repo pins, or running \`npm install\` in a way that re-resolves unrelated dependencies.
>
> If the changes are unexpected, try restoring the lockfile from the base branch and re-running the install with the pinned npm version.
`;

    if (existing) {
      await github.rest.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: existing.id,
        body,
      });
      return;
    }

    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body,
    });
    return;
  }

  // Below the threshold again, but there is an existing comment: mark it as outdated.
  if (existing && !existing.body?.includes(outdatedMarker)) {
    const previous = existing.body?.replace(marker, '').trim();
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body: `${marker}
${outdatedMarker}
> [!NOTE]
> The package-lock.json diff is no longer above the threshold, so this notice no longer applies.

<details><summary>Previous message</summary>

${previous}

</details>`,
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
