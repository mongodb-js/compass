const { cli } = require('cli-ux');
const notifier = require('node-notifier');
const Listr = require('listr');
const version = require('./version');

module.exports = async function waitForAssets(releaseVersion, { downloadCenter }) {
  const oldConfig = await downloadCenter.downloadConfig();
  const newConfig = downloadCenter.replaceVersion(oldConfig, releaseVersion);
  const releaseChannel = version.getReleaseChannel(releaseVersion);
  const assets = downloadCenter.getAssets(newConfig, releaseChannel);
  const tasks = assets.map((asset) => ({
    title: asset.download_link,
    task: () => downloadCenter.waitForAsset(asset)
  }));

  try {
    cli.info('Waiting for assets to be available');
    cli.action.start('');

    await (new Listr(tasks, { concurrent: true })).run();

    cli.action.stop();

    notifier.notify({
      title: `Compass release v${releaseVersion}`,
      message: 'Release assets ready.'
    });
  } catch (error) {
    notifier.notify({
      title: `Compass release v${releaseVersion}`,
      message: 'Failed. Assets unreacheable.'
    });

    throw error;
  }
};
