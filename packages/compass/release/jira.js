const chalk = require('chalk');
const { cli } = require('cli-ux');
const fetch = require('make-fetch-happen');
const { link, manualAction } = require('./ux');
const { isGa } = require('./version');

const MONGODB_JIRA_BASE_URL = 'https://jira.mongodb.org';

function buildFetchJqlUrl(jiraApiBaseUrl, jql) {
  const url = new URL(`${jiraApiBaseUrl}/rest/api/2/search`);
  url.searchParams.append('jql', jql);
  url.searchParams.append('fields', 'key,status,summary');
  url.searchParams.append('maxResults', '1');
  return url.toString();
}

const releaseVersionJql = (releaseVersion) =>
  `project = COMPASS AND fixVersion = ${releaseVersion} AND issuetype = Release`;

async function checkReleaseTicketInProgress(releaseVersion) {
  if (!isGa(releaseVersion)) {
    // not requiring a ticket for beta
    return;
  }

  const jiraTicketUrl = buildFetchJqlUrl(
    MONGODB_JIRA_BASE_URL,
    releaseVersionJql(releaseVersion)
  );

  const result = await fetch(jiraTicketUrl).then((res) => res.json());

  if (result?.issues?.length === 0) {
    throw new Error(
      chalk.red(`Release issue for version ${chalk.bold(
        releaseVersion
      )} not found.
Please create one and move it to ${chalk.bold('In Progress')} to continue.`)
    );
  }

  const issue = result.issues[0];
  const issueUrl = `${MONGODB_JIRA_BASE_URL}/browse/${issue.key}`;

  if (issue?.fields?.status?.name !== 'In Progress') {
    throw new Error(
      chalk.red(`The release ticket ${link(issueUrl)} is not ${chalk.bold(
        'In Progress'
      )}.
Please move it to ${chalk.bold('In Progress')} to continue.`)
    );
  }

  cli.info(
    manualAction(
      `The release issue for ${chalk.bold(releaseVersion)} is ${link(
        issueUrl
      )}.`,
      `\nPlease remember to move it to ${chalk.bold(
        'Done'
      )} once the release is complete.`
    )
  );
}

module.exports = { checkReleaseTicketInProgress };
