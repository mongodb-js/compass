'use strict';

/**
 * Upload release assets to GitHub and S3.
 */
const Promise = require('bluebird');
const _ = require('lodash');
const GitHub = require('github');
const github = new GitHub({version: '3.0.0', 'User-Agent': 'hadron-build'});
const cli = require('mongodb-js-cli')('hadron-build:upload');
const abortIfError = cli.abortIfError.bind(cli);
const Target = require('../lib/target');

const downloadCenter = require('../lib/download-center');


let createGitHubRelease = (CONFIG) => {
  const p = Promise.defer();
  var opts = {
    owner: '10gen',
    repo: 'compass',
    draft: true,
    tag_name: `v${CONFIG.version}`,
    name: CONFIG.version,
    target_commitish: process.env.EVERGREEN_REVISION,
    body: '> TODO (imlucas) Auto generate this.'
  };

  cli.debug('Creating release', opts);

  github.repos.createRelease(opts, function(err, res) {
    if (err) p.reject(err);

    cli.debug('Created release', res);
    p.resolve(res);
  });
  return p.promise;
};

let getOrCreateGitHubRelease = (CONFIG) => {
  const p = Promise.defer();
  const opts = {
    owner: '10gen',
    repo: 'compass'
  };
  github.repos.getReleases(opts, (err, releases) => {
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
    owner: '10gen',
    repo: 'compass',
    id: existing.id
  };

  const p = Promise.defer();
  github.repos.deleteAsset(opts, (err, res) => {
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
    owner: '10gen',
    repo: 'compass',
    id: release.id,
    name: asset.name,
    filePath: asset.path
  };

  cli.spinner(`Uploading ${asset.name}`);

  const p = Promise.defer();
  github.repos.uploadAsset(opts, function(err, res) {
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

  if (!process.env.GITHUB_TOKEN) {
    cli.warn('Skipping publish release because process.env.GITHUB_TOKEN not set.');
    return Promise.resolve();
  }

  github.authenticate({
    token: process.env.GITHUB_TOKEN,
    type: 'oauth'
  });

  return getOrCreateGitHubRelease(CONFIG)
    .then((release) => {
      return CONFIG.assets.map((asset) => uploadGitHubReleaseAsset(CONFIG, release, asset));
    });
};

exports.command = 'upload [options]';

exports.describe = 'Upload assets from `release`.';

exports.builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd()
  }
};

exports.handler = function(argv) {
  cli.argv = argv;

  var fs = require('fs');
  var target = new Target(argv.dir);

  target.assets = target.assets.filter(function(asset) {
    var exists = fs.existsSync(asset.path);
    if (!exists) {
      cli.warn(`Excluding ${asset.path} from upload because it does not exist.`);
    }
    return exists;
  });

  maybePublishGitHubRelease(target)
    .then( () => downloadCenter.maybeUpload(target))
    .catch(abortIfError);
};
