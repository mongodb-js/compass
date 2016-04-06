var createCLI = require('mongodb-js-cli');
var config = require('./config');

var cli = createCLI('mongodb-compass:scripts:publish');
cli.yargs.usage('$0 [options]')
  .options(config.options)
  .option('commit_sha1', {
    // TODO (imlucas) evergeen sets an environment variable
    default: 'master'
  })
  .help('help');

if (cli.argv.verbose) {
  require('debug').enable('mon*');
}

var path = require('path');
var execFile = require('child_process').execFile;
var which = require('which');
var _ = require('lodash');
var async = require('async');
var format = require('util').format;

/**
 * @param {String} sha
 * @param {Function} done
 * @example
 * > isGitTag('2557def1585d4ac6752f9c21fc4e9af4e41979df', function(){console.log(arguments);});
 * > { '0': null, '1': false }
 * > isGitTag('1a65be32d833f0eb5b3e3c68b15dbeff20ddcd35', function(){console.log(arguments);});
 * > { '0': null, '1': true }
 */
module.exports.isGitTag = function(sha, done) {
  module.exports.getGitTag(sha, function(err, tag) {
    if (err) {
      return done(err);
    }
    done(null, tag !== null);
  });
};

/**
 * @param {String} sha
 * @param {Function} done
 * @example
 * > p.getGitTag('2557def1585d4ac6752f9c21fc4e9af4e41979df', function(){console.log(arguments);});
 * > { '0': null, '1': null }
 * > p.getGitTag('1a65be32d833f0eb5b3e3c68b15dbeff20ddcd35', function(){console.log(arguments);});
 > { '0': null, '1': 'v1.2.0-pre.0' }
 */
module.exports.getGitTag = function(sha, done) {
  var GIT = which.sync('git');
  var opts = {
    cwd: path.join(__dirname, '..'),
    env: process.env
  };

  var args = [
    'describe',
    '--exact-match',
    sha
  ];
  execFile(GIT, args, opts, function(err, stdout, stderr) {
    if (!err) {
      var tag = stdout.toString('utf-8').split('\n')[0];
      done(null, tag);
      return;
    }
    if (stderr.toString('utf-8').indexOf('no tag exactly matches') > -1) {
      done(null, null);
      return;
    }
    done(err);
  });
};


var GitHub = require('github');
var token = process.env.GITHUB_TOKEN;

var github = new GitHub({
  version: '3.0.0',
  'User-Agent': 'MongoDB Compass Build'
});

github.authenticate({
  token: token,
  type: 'oauth'
});

function createRelease(CONFIG, done) {
  var version = cli.argv.version;

  var opts = {
    // TODO (imlucas) cli option.
    owner: '10gen',
    repo: 'compass',
    draft: true,
    tag_name: 'v' + version,
    name: version,
    target_commitish: cli.argv.commit_sha1,
    body: '### Notable Changes\n\n* Something new'
  };

  cli.debug('Creating release', opts);
  github.releases.createRelease(opts, function(err, res) {
    if (err) {
      return done(err);
    }
    cli.debug('Created release', res);
    done(null, res);
  });
}

function getOrCreateRelease(CONFIG, done) {
  github.releases.listReleases({
    // TODO (imlucas) cli option.
    owner: '10gen',
    repo: 'compass'
  }, function(err, releases) {
    if (err) {
      return done(err);
    }

    var latestDraft = _.chain(releases)
      .filter('draft')
      .first()
      .value();

    cli.debug('Latest draft is', latestDraft);
    if (latestDraft) {
      return done(null, latestDraft);
    }
    cli.debug('Creating new draft release');
    createRelease(CONFIG, done);
  });
}

function removeReleaseAssetIfExists(release, asset, done) {
  cli.debug('removeReleaseAssetIfExists', release, asset);
  var existing = release.assets.filter(function(a) {
    return a.name === asset.name;
  })[0];

  if (!existing) {
    return done();
  }

  cli.debug('Removing existing `%s`', asset.name);
  var opts = {
    owner: '10gen',
    repo: 'compass',
    id: existing.id
  };

  github.releases.deleteAsset(opts, done);
}

function doReleaseAssetUpload(release, asset, done) {
  var opts = {
    owner: '10gen',
    repo: 'compass',
    id: release.id,
    name: asset.name,
    filePath: asset.path
  };

  cli.spinner(format('Uploading %s', asset.name));
  github.releases.uploadAsset(opts, function(_err, res) {
    if (_err) {
      _err.stack = _err.stack || '<no stacktrace>';
      cli.error(format('Failed to upload %s', asset.name));
      done(_err);
      return;
    }
    cli.debug('Asset upload returned', res);
    cli.ok(format('Uploaded %s', asset.name));
    done();
  });
}

function uploadReleaseAsset(release, asset, done) {
  async.series([
    removeReleaseAssetIfExists.bind(null, release, asset),
    doReleaseAssetUpload.bind(null, release, asset)
  ], done);
}

function uploadAllReleaseAssets(CONFIG, release, done) {
  async.series(CONFIG.assets.map(function(asset) {
    return uploadReleaseAsset.bind(null, release, asset);
  }), done);
}

function main() {
  /**
   * TODO (imlucas) If not `isGitTag(cli.argv.commit_sha1)`, exit.
   */
  config.get(cli, function(err, CONFIG) {
    cli.abortIfError(err);

    async.waterfall([
      getOrCreateRelease.bind(null, CONFIG),
      uploadAllReleaseAssets.bind(null, CONFIG)
    ], function(_err) {
      cli.abortIfError(_err);
      cli.ok('done');
    });
  });
}

/**
 * ## Main
 */
if (cli.argv.$0 && cli.argv.$0.indexOf('publish.js') === -1) {
  module.exports = exports;
} else {
  main();
}
