/* eslint-disable no-console */
const { cli } = require('cli-ux');
const semver = require('semver');
const chalk = require('chalk');
const version = require('./version');

module.exports = async function publish(
  releaseVersion, { downloadCenter, github }
) {
  await uploadConfigIfNewer(releaseVersion, { downloadCenter });
  await waitGithubRelease(releaseVersion, { github });

  cli.info(chalk.green(`Release ${releaseVersion} complete.`));
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

async function waitGithubRelease(releaseVersion, { github }) {
  cli.action.start('Waiting for Github release to be created');
  const release = await github.waitForReleaseCreated(releaseVersion);
  cli.action.stop();

  if (!release.draft) {
    cli.action.start('Waiting for Github release to be published');
    cli.action.stop(chalk.dim(`skipped: release ${releaseVersion} is already public.`));
    return;
  }

  cli.info('');
  cli.info(
    chalk.bgYellow(
      chalk.gray(
        chalk.bold(' MANUAL ACTION REQUIRED!: '))
    ),
    'The Github release is still in draft.'
  );
  cli.info(`Please review and publish the release on Github:\n\t${release.html_url}`);
  cli.info('');
  cli.info('You can run', chalk.bold('npm run release changelog'), 'to get the release notes.');
  cli.info('');

  cli.action.start('Waiting for Github release to be published');
  await github.waitForReleasePublished(releaseVersion);
  cli.action.stop();
}
