const { cli } = require('cli-ux');
const chalk = require('chalk');
const _ = require('lodash');
const git = require('./git');
const ux = require('./ux');

function capitalize(s) {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderCommit({ scope, message, pr, ticket }) {
  let links = [ticket, pr].filter(Boolean).join(', ');

  if (links) {
    links = ` (${links})`;
  }

  return `${scope ? `**${scope}**` + ': ' : ''}${capitalize(message)}${links}`;
}

async function render(previousTag, releaseTag) {
  cli.info('');
  cli.info(`Changes from ${chalk.bold(previousTag)}:`);

  const parseCommit = (commit) => {
    const PR_RE = /\s+\((#\d+)\)$/;
    const pr = (commit.match(PR_RE) || [])[1];
    commit = commit.replace(PR_RE, '');

    const TICKET_RE_WITH_BRACES = /\s+\((COMPASS-\d+)\)$/;
    let ticket = (commit.match(TICKET_RE_WITH_BRACES) || [])[1];
    commit = commit.replace(TICKET_RE_WITH_BRACES, '');

    const TICKET_RE_WITHOUT_BRACES = /\s+(COMPASS-\d+)$/;
    ticket = (commit.match(TICKET_RE_WITHOUT_BRACES) || [])[1];
    commit = commit.replace(TICKET_RE_WITHOUT_BRACES, '');

    const COMMIT_RE = /^(?<type>feat|fix|perf)(\((?<scope>[^)]*)\))?:\s*(?<message>\S.*)/;
    const groups = (commit.match(COMMIT_RE) || []).groups;
    if (!groups) {
      return;
    }

    if (groups.scope && groups.scope.match(/COMPASS-\d+/)) {
      ticket = groups.scope;
      groups.scope = '';
    }

    groups.message = groups.message.trim();
    return {...groups, pr, ticket};
  };

  const renderLine = (commit) => `- ${renderCommit(commit)}`;
  const renderSection = ({ title, commits }) => `## ${title}\n\n${commits.map(renderLine).join('\n')}\n\n`;

  const commits = _.uniq(await git.log(previousTag, releaseTag))
    .map(parseCommit)
    .filter(Boolean); // only conventional commits

  const changes = [
    {
      title: 'Features',
      commits: commits.filter(({ type }) => type === 'feat')
    },
    {
      title: 'Bug Fixes',
      commits: commits.filter(({ type }) => type === 'fix')
    },
    {
      title: 'Performance Improvements',
      commits: commits.filter(({ type }) => type === 'perf')
    }
  ]
    .filter((section) => section.commits.length)
    .map(renderSection)
    .join('\n');

  cli.info(
    `${changes}You can see the full list of commits here:`,
    '\n' + ux.link(`https://github.com/mongodb-js/compass/compare/${previousTag}...${releaseTag}`)
  );
}

module.exports = {
  render
};

