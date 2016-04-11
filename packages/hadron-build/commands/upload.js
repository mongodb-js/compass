'use strict';

/**
 * Wouldn't it be great if you or a CI system were notified properly
 * that you aren't using the right version of node.js, npm or Python?
 *
 * @see https://github.com/atom/atom/blob/master/script/utils/verify-requirements.js
 */
const fs = require('fs-extra');
const _ = require('lodash');
const format = require('util').format;
const GitHub = require('github');
const github = new GitHub({version: '3.0.0', 'User-Agent': 'hadron-build'});
const cli = require('mongodb-js-cli')('hadron-build:upload');

const config = require('../lib/config');
const AWS = require('aws-sdk');


function createGitHubRelease(CONFIG) {
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

  const p = new Promise();
  github.releases.createRelease(opts, function(err, res) {
    if (err) p.reject(err);

    cli.debug('Created release', res);
    p.resolve(res);
  });
  return p;
}

function getOrCreateGitHubRelease(CONFIG) {
  const p = new Promise();
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
}

function removeGitHubReleaseAssetIfExists(CONFIG, release, asset) {
  var existing = _.chain(release.assets)
    .filter((a) => a.name === asset.name)
    .first()
    .value();

  if (!existing) {
    return Promise.resolve(false);
  }

  cli.debug('Removing existing `%s`', asset.name);
  var opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo,
    id: existing.id
  };

  const p = new Promise();
  github.releases.deleteAsset(opts, (err, res) => {
    if (err) {
      return p.reject(err);
    }
    cli.debug('Asset deleted', res);
    return p.resolve(true);
  });
  return p;
}

function doGitHubReleaseAssetUpload(CONFIG, release, asset) {
  var opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo,
    id: release.id,
    name: asset.name,
    filePath: asset.path
  };

  cli.spinner(`Uploading ${asset.name}`);
  var promise = new Promise();
  github.releases.uploadAsset(opts, function(err, res) {
    if (err) {
      err.stack = err.stack || '<no stacktrace>';
      cli.error(`Failed to upload ${asset.name}`);
      return promise.reject(err);
    }
    cli.debug('Asset upload returned', res);
    cli.ok(`Uploaded ${asset.name}`);
    promise.resolve(asset);
  });
  return promise;
}

function uploadGitHubReleaseAsset(CONFIG, release, asset) {
  return removeGitHubReleaseAssetIfExists(CONFIG, release, asset)
    .then(() => doGitHubReleaseAssetUpload(CONFIG, release, asset));
}

function uploadAllGitHubReleaseAssets(CONFIG, release) {
  return CONFIG.assets.map( (asset) => uploadGitHubReleaseAsset(CONFIG, release, asset));
}

function maybePublishGitHubRelease(CONFIG) {
  if (CONFIG.channel === 'dev') {
    cli.info('Skipping publish release for dev channel.');
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
    .then((release) => uploadAllGitHubReleaseAssets(CONFIG, release));
}

let uploadEvergreenAssetToS3 = (asset) => {
  const params = {
    Bucket: process.env.EVERGREEN_BUCKET,
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

  const s3 = new AWS.S3({
    accessKeyId: process.env.EVERGREEN_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.EVERGREEN_AWS_SECRET_ACCESS_KEY
  });

  const promise = new Promise();

  s3.upload(params)
    .on('httpUploadProgress', (evt) => {
      if (!evt.total) return;
      cli.debug(`upload ${asset.name}: ${evt.total / evt.loaded}`);
    })
    .send(function(err, data) {
      if (err) {
        cli.debug(`uploading ${asset.name} failed: ${err}`);
        promise.reject(err);
        return;
      }
      cli.debug(`upload of ${asset.name} complete`);
      promise.resolve(data);
    });
  return promise;
};

function requireEnvironmentVariables(keys) {
  keys.forEach((key) => {
    if (process.env[key]) return true;
    throw new TypeError(`Please set the environment variable ${key}`);
  });
}

let maybeUploadEvergreenAssets = (CONFIG) => {
  if (!process.env.EVERGREEN) {
    cli.debug('EVERGREEN environment var not set.  Skipping upload assets.');
    return Promise.resolve();
  }

  requireEnvironmentVariables([
    'EVERGREEN_AWS_ACCESS_KEY_ID',
    'EVERGREEN_AWS_SECRET_ACCESS_KEY',
    'EVERGREEN_BUCKET',
    'EVERGREEN_S3_KEY_PREFIX'
  ]);

  return CONFIG.assets.map(uploadEvergreenAssetToS3);
};

exports.builder = {};

exports.handler = function(argv) {
  cli.argv = argv;
  var CONFIG = config.get(cli);

  Promise.all(maybeUploadEvergreenAssets(CONFIG))
    .then(() => maybePublishGitHubRelease(CONFIG))
    .catch((err) => cli.abortIfError(err));
};
