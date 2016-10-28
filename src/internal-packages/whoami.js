const db = app.dataService.client.database;
const secondaryPreferred = require('mongodb-read-preference').secondaryPreferred;
const _ = require('lodash');
const debug = require('debug')('mongodb-security:whoami');

function command(spec) {
  _.assign(spec, {showPrivileges: true});
  return db.command(spec, {readPreference: secondaryPreferred});
}

function getUserInfo(user) {
  if (!user || _.keys(user).length === 0) {
    debug('Invalid user spec for getUserInfo', user);
    return {};
  }
  return command({usersInfo: user})
    .then((res) => {
      const info = _.first(_.get(res, 'users', []));
      debug('userInfo', info);
      return info;
    });
}

function getCurrentUser() {
  /**
   * TODO (imlucas) Could just check `app.dataService.connection.authentication`
   * for `NONE` instead of running command and getting no user.
   */
  return command({connectionStatus: 1})
    .then((res) => {
      const user = _.first(_.get(res, 'authInfo.authenticatedUsers', []));
      if (!user) {
        debug('No logged in user');
        return {};
      }

      debug('Current user is', user);
      return getUserInfo(user);
    });
}

getCurrentUser()
  .then((res) => console.log('Current User Info', res))
  .catch((err) => console.error('error', err));
