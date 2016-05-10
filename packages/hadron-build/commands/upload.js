'use strict';

/**
 * Wouldn't it be great if you or a CI system were notified properly
 * that you aren't using the right version of node.js, npm or Python?
 *
 * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
 */
const Promise = require('bluebird');
const _ = require('lodash');
const GitHub = require('github');
const github = new GitHub({version: '3.0.0', 'User-Agent': 'hadron-build'});
const cli = require('mongodb-js-cli')('hadron-build:upload');
const abortIfError = cli.abortIfError.bind(cli);

const config = require('../lib/config');
const downloadCenter = require('../lib/download-center');


let createGitHubRelease = (CONFIG) => {
  const p = Promise.defer();
  var opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo,
    draft: true,
    tag_name: `v${CONFIG.version}`,
    name: CONFIG.version,
    target_commitish: CONFIG.target_commitish,
    body: `### Notable Changes
    * Something new
    `
  };

  cli.debug('Creating release', opts);

  github.releases.createRelease(opts, function(err, res) {
    if (err) p.reject(err);

    cli.debug('Created release', res);
    p.resolve(res);
  });
  return p.promise;
};

let getOrCreateGitHubRelease = (CONFIG) => {
  const p = Promise.defer();
  const opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo
  };
  github.releases.listReleases(opts, (err, releases) => {
    if (err) {
      return p.reject(err);
    }

    let existing = _.find(releases, (release) => release.name === CONFIG.version);
    if (existing) {
      cli.debug(`Found existsing release for ${CONFIG.version}`, existing);
      return p.resolve(existing);
    }

    cli.debug(`Creating new draft release for ${CONFIG.version}`);
    createGitHubRelease(CONFIG)
      .then( (release) => p.resolve(release))
      .catch( (_err) => p.reject(_err));
  });
  return p.promise;
};

let removeGitHubReleaseAssetIfExists = (CONFIG, release, asset) => {
  let existing = _.chain(release.assets)
    .filter((a) => a.name === asset.name)
    .first()
    .value();

  if (!existing) {
    return Promise.resolve(false);
  }

  cli.debug(`Removing existing asset ${asset.name}`);
  const opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo,
    id: existing.id
  };

  const p = Promise.defer();
  github.releases.deleteAsset(opts, (err, res) => {
    if (err) {
      return p.reject(err);
    }
    cli.debug('Asset deleted', res);
    return p.resolve(true);
  });
  return p.promise;
};

let doGitHubReleaseAssetUpload = (CONFIG, release, asset) => {
  const opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo,
    id: release.id,
    name: asset.name,
    filePath: asset.path
  };

  cli.spinner(`Uploading ${asset.name}`);

  const p = Promise.defer();
  github.releases.uploadAsset(opts, function(err, res) {
    if (err) {
      err.stack = err.stack || '<no stacktrace>';
      cli.error(`Failed to upload ${asset.name}`);
      return p.reject(err);
    }
    cli.debug('Asset upload returned', res);
    cli.ok(`Uploaded ${asset.name}`);
    p.resolve(asset);
  });
  return p.promise;
};

let uploadGitHubReleaseAsset = (CONFIG, release, asset) => {
  if (release.draft === true) {
    return removeGitHubReleaseAssetIfExists(CONFIG, release, asset)
      .then(() => doGitHubReleaseAssetUpload(CONFIG, release, asset));
  }

  let existing = _.chain(release.assets)
    .filter((a) => a.name === asset.name)
    .first()
    .value();

  if (existing) {
    cli.debug('Asset already exists and release is currently not a draft.  skipping.', existing);
    return Promise.resolve(existing);
  }

  return doGitHubReleaseAssetUpload(CONFIG, release, asset);
};

let maybePublishGitHubRelease = (CONFIG) => {
  if (CONFIG.channel === 'dev') {
    cli.info('Skipping publish GitHub release for dev channel.');
    return Promise.resolve();
  }

  if (!CONFIG.github_token) {
    cli.warn('Skipping publish release because github_token not set.');
    return Promise.resolve();
  }

  github.authenticate({
    token: CONFIG.github_token,
    type: 'oauth'
  });

  return getOrCreateGitHubRelease(CONFIG)
    .then((release) => {
      return CONFIG.assets.map((asset) => uploadGitHubReleaseAsset(CONFIG, release, asset));
    });
};

exports.command = 'upload [options]';

exports.describe = 'Upload assets from `release`.';

exports.builder = {};
_.assign(exports.builder, config.options);

exports.handler = function(argv) {
  cli.argv = argv;
  var CONFIG = config.get(cli);
  maybePublishGitHubRelease(CONFIG)
    .then( () => downloadCenter.maybeUpload(CONFIG))
    .catch(abortIfError);
};
