/* eslint-disable no-console */
const { cli } = require('cli-ux');
const semver = require('semver');
const chalk = require('chalk');
const version = require('./version');
const ux = require('./ux');

module.exports = async function publish(
  releaseVersion, { downloadCenter, github, changelog }
) {
  await uploadConfigIfNewer(releaseVersion, { downloadCenter });
  await waitGithubRelease(releaseVersion, { github, changelog });

  cli.info(
    '\n',
    chalk.green(`🚀 Release ${chalk.bold(releaseVersion)} complete.`), '\n\n',
    'Please verify that everything is in order:', '\n\n',
    '▶ Download Center: ', ux.link('https://www.mongodb.com/try/download/compass'), '\n',
    '▶ Github Releases: ', ux.link('https://github.com/mongodb-js/compass/releases'), '\n',
  );
};

async function uploadConfigIfNewer(
  releaseVersion, { downloadCenter }
) {
  cli.action.start('Uploading new download center config');

  const oldConfig = await downloadCenter.downloadConfig();
  const releaseChannel = version.getReleaseChannel(releaseVersion);
  const oldVersion = downloadCenter.getVersion(oldConfig, releaseChannel);

  if (semver.gte(oldVersion, releaseVersion)) {
    cli.action.stop(chalk.dim(`skipped: ${oldVersion} (old) >= ${releaseVersion} (new)`));
    return;
  }

  const newConfig = downloadCenter.replaceVersion(oldConfig, releaseVersion);
  await downloadCenter.uploadConfig(newConfig);

  cli.action.stop();
}

async function waitGithubRelease(releaseVersion, { github, changelog }) {
  cli.info('\n' + ux.separator(`👇 CHANGELOG FOR ${releaseVersion}`));
  await changelog.render(releaseVersion);
  cli.info('\n' + ux.separator('👆 CHANGELOG'), '\n');

  cli.info(
    '\n',
    ux.manualAction(
      'Make sure the release is published on Github: ',
      ux.link('https://github.com/mongodb-js/compass/releases'), '\n\n',
      'Copy the changelog from above and put it into the description of the release.', '\n\n',
      chalk.bold('NOTE:'), ' if a release is not published on Github the Compass auto-update will not pick that up.',
    ),
    '\n'
  );

  cli.info('Press enter when you have published the Github release...');
  ux.waitForEnter();

  cli.action.start(`Checking if Github release ${chalk.bold(releaseVersion)} really is published.`);
  const alreadyPublished = await github.isReleasePublished(releaseVersion);
  if (!alreadyPublished) {
    cli.error('Release is not published yet - did you really publish?');
    cli.info('Please publish the release on Github and run publish again to verify it worked.');
  }
  cli.action.stop();
}
