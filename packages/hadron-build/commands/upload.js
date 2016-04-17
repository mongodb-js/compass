'use strict';

/**
 * Wouldn't it be great if you or a CI system were notified properly
 * that you aren't using the right version of node.js, npm or Python?
 *
 * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
 */
const Promise = require('bluebird');
const fs = require('fs-extra');
const _ = require('lodash');
const GitHub = require('github');
const github = new GitHub({version: '3.0.0', 'User-Agent': 'hadron-build'});
const cli = require('mongodb-js-cli')('hadron-build:upload');
const abortIfError = cli.abortIfError.bind(cli);

const config = require('../lib/config');
const AWS = require('aws-sdk');


let createGitHubRelease = (CONFIG) => {
  const p = Promise.defer();
  var opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo,
    draft: true,
    tag_name: `${CONFIG.version}`,
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

    var latestDraft = _.chain(releases)
      .filter('draft')
      .first()
      .value();

    cli.debug('Latest draft is', latestDraft);
    if (latestDraft) return p.resolve(latestDraft);

    cli.debug('Creating new draft release');
    createGitHubRelease(CONFIG).then(p);
  });
  return p;
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
  return removeGitHubReleaseAssetIfExists(CONFIG, release, asset)
    .then(() => doGitHubReleaseAssetUpload(CONFIG, release, asset));
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

  getOrCreateGitHubRelease(CONFIG)
    .then((release) => {
      return CONFIG.assets.map((asset) => uploadGitHubReleaseAsset(CONFIG, release, asset));
    });
};

let uploadEvergreenAssetToS3 = (asset) => {
  const p = Promise.defer();

  const params = {
    Bucket: process.env.EVERGREEN_S3_BUCKET,
    Key: `${process.env.EVERGREEN_S3_KEY_PREFIX}/${asset.name}`,
    Body: fs.createReadStream(asset.path),
    ACL: 'public-read',
    Metadata: {
      Name: asset.label || asset.name,
      EvergreenProject: process.env.EVERGREEN_PROJECT,
      EvergreenBuildVariant: process.env.EVERGREEN_BUILD_VARIANT,
      EvergreenRevision: process.env.EVERGREEN_REVISION
    }
  };

  try {
    AWS.config.update({
      accessKeyId: process.env.EVERGREEN_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.EVERGREEN_AWS_SECRET_ACCESS_KEY
    });
    const upload = new AWS.S3.ManagedUpload({
      params: params
    });
    upload.send(function(err, data) {
      if (err) {
        cli.debug(`uploading ${asset.name} failed: ${err}`);
        p.reject(err);
        return;
      }
      cli.debug(`upload of ${asset.name} complete`);
      p.resolve(data);
    });
    upload.on('httpUploadProgress', (evt) => {
      cli.debug('got httpUploadProgress', evt);
      if (!evt.total) return;
      cli.debug(`upload ${asset.name}: ${evt.total / evt.loaded}`);
    });
  } catch (err) {
    return Promise.reject(err);
  }
  return p.promise;
};

function requireEnvironmentVariables(keys) {
  for (let key of keys) {
    if (process.env[key]) return true;
    throw new TypeError(`Please set the environment variable ${key}`);
  }
}

/* eslint no-unused-vars: 0 */
let maybeUploadEvergreenAssets = (CONFIG) => {
  if (!process.env.EVERGREEN) {
    cli.info('`EVERGREEN` environment variable not set.  ' +
      'Skipping upload of Evergreen assets to S3.');
    return Promise.resolve(false);
  }

  try {
    requireEnvironmentVariables([
      'EVERGREEN_AWS_ACCESS_KEY_ID',
      'EVERGREEN_AWS_SECRET_ACCESS_KEY',
      'EVERGREEN_S3_BUCKET',
      'EVERGREEN_S3_KEY_PREFIX'
    ]);
  } catch (err) {
    return Promise.reject(err);
  }

  cli.debug(`Uploading ${CONFIG.assets.length} assets produced by evergreen to S3...`);
  cli.debug(` - EVERGREEN_S3_BUCKET: ${process.env.EVERGREEN_S3_BUCKET}`);
  cli.debug(` - EVERGREEN_S3_KEY_PREFIX: ${process.env.EVERGREEN_S3_KEY_PREFIX}`);
  return Promise.all(CONFIG.assets.map(uploadEvergreenAssetToS3));
};

exports.command = 'upload [options]';

exports.describe = 'Upload assets from `release`.';

exports.builder = {};
_.assign(exports.builder, config.options);

exports.handler = function(argv) {
  cli.argv = argv;
  var CONFIG = config.get(cli);

  // maybeUploadEvergreenAssets(CONFIG)
  maybePublishGitHubRelease(CONFIG)
    .catch(abortIfError);
};
