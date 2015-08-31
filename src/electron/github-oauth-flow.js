var parseURL = require('url').parse;
var request = require('request');
var octonode = require('octonode');
var createWindow = require('./window-manager').create;
var config = require('./config');
var format = require('util').format;
var debug = require('debug')('scout:electron:github-oauth-flow');
var client;

function exchangeCodeForToken(code, fn) {
  var url = format('https://github.com/login/oauth/access_token'
  + '?client_id=%s&client_secret=%s&code=%s',
    config.get('github:client_id'), config.get('github:client_secret'), code);

  request.get({
    url: url,
    json: true
  }, function(err, res, body) {
    debug('exchange result res', res);
    if (err) {
      err.body = body;
      err.res = res;
      return fn(err);
    }
    fn(null, body);
  });
}

function getUser(access_token, done) {
  client = octonode.client(access_token);
  client.get('/user', {}, function(err, status, body) {
    if (err) return done(err);
    var res = {
      avatar_url: body.avatar_url,
      name: body.name,
      company_name: body.company,
      location: body.location,
      email: body.email,
      github_username: body.login,
      github_score: body.public_repos + body.public_gists + body.followers + body.following,
      github_last_activity_at: body.updated_at
    };

    debug('loaded github user data', res);
    done(null, res);
  });
}

function oauthCallback(url, done) {
  var query = parseURL(url, true).query;
  debug('oauth callback response', query);
  if (query.error) {
    return done(new Error('GitHub auth failed: ' + JSON.stringify(query)));
  }
  exchangeCodeForToken(query.code, function(err, res) {
    if (err) return done(err);

    getUser(res.access_token, function(err, data) {
      if (err) return done(err);

      data.github_access_token = res.access_token;
      done(null, data);
    });
  });
}

module.exports = function(done) {
  if (!config.get('github:enabled')) {
    return process.nextTick(function() {
      done(new Error('GitHub not enabled in config'));
    });
  }
  var url = format('https://github.com/login/oauth/authorize?client_id=%s&scope=%s',
    config.get('github:client_id'), config.get('github:scope'));
  debug('redirecting to', url);

  var _window = createWindow({
    url: url,
    centered: true,
    'always-on-top': true,
    'use-content-size': true,
    'node-integration': false // Important or form inputs won't work.
  });
  debug('starting github oauth web flow...');

  var pending = true;
  var onClose = function() {
    if (!pending) return;
    var err = new Error('GitHub oAuth flow cancelled');
    err.cancelled = true;
    done(err);
  };
  // Handle the user starting the github oauth flow but at
  // any time they could chose to close the window and cancel.
  _window.on('close', onClose);

  _window.webContents.on('did-get-redirect-request', function(event, fromURL, toURL) {
    debug('github redirected authWindow %s -> %s', event, fromURL, toURL);
    oauthCallback(toURL, function(err, res) {
      pending = false;
      _window.close();
      _window = null;
      done(err, res);
    });
  });
};
