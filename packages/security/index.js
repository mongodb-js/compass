var ACTIONS = require('./res/actions.json');
var ROLES = require('./res/roles.json');

var each = require('lodash.foreach');
var every = require('lodash.every');
var debug = require('debug')('mongodb-security');

function inflateAction(name) {
  var def = ACTIONS[name];
  def._id = name;
  return def;
}

var special = {
  db: function(s) {
    return ['local', 'config'].indexOf(s) > -1;
  },
  collection: function(s) {
    return s.startsWith('system.');
  // return ['system.profile', 'system.indexes', 'system.js', 'system.namespaces'].indexOf(s) > -1;
  }
};

/**
 * returns only resources that mach a certain criterion specified by `key`.
 *
 * If the key is 'database', only return resources that correspond to a
 * database, e.g. {db: "foo", collection: ""}.
 *
 * If the key is 'collection', only return resources that correspond to a
 * collection, e.g. {db: "foo", collection: "bar"}.
 *
 * If they key is 'special', only return resources that match the special
 * definition (see above), or {cluster: 1} or {anyResource: 1}.
 *
 * @param  {Array[Object]} resources  array of resources
 * @param  {String} key               one of 'database', 'collection', 'special'
 * @return {[type]}                   return resources that only match the
 *                                    given key
 */
var filterResources = function(resources, key) {
  return resources.filter(function(resource) {
    // first handle {cluster: 1}, {anyResource: 1} and other special resources
    if (resource.cluster
      || resource.anyResource
      || special.db(resource.db)
      || special.collection(resource.collection)
      || (resource.db === '' && resource.collection !== '')) {
      return key === 'special';
    }
    if (key === 'database') {
      return resource.db !== '' && resource.collection === '';
    } else if (key === 'collection') {
      return resource.db !== '' && resource.collection !== '';
    }
    return false;
  });
};


/**
 * Return a list of resources for which all the specified actions are
 * present in the user or role document.
 *
 * @param  {Object} userOrRole        user or role definition
 * @param  {Array[String]} actions    list of required actions
 * @return {Array[Object]}            list of resources containing all actions
 */
var getResourcesWithActions = function(userOrRole, actions, filter) {
  // `inheritedPrivileges` contains all privileges
  var privileges = userOrRole.inheritedPrivileges;
  var resources = [];

  each(privileges, function(privilege) {
    var allActionsPresent = every(actions, function(action) {
      return privilege.actions.indexOf(action) !== -1;
    });
    if (allActionsPresent) {
      resources.push(privilege.resource);
    }
  });
  if (filter) {
    return filterResources(resources, filter);
  }
  return resources;
};


var inflate = function(userOrRole) {
  // `inheritedPrivileges` contains all privileges
  var privileges = userOrRole.inheritedPrivileges;
  privileges.sort(function(a, b) {
    return a.actions.length - b.actions.length;
  });

  var res = userOrRole;
  res.grants = [];

  privileges.map(function(privilege) {
    if (special.db(privilege.resource.db)) {
      debug('skip special db privilege', privilege.resource);
      return false;
    }

    if (special.collection(privilege.resource.collection)) {
      debug('skip special collection grant', privilege.resource);
      return false;
    }

    var grant = {
      resource: privilege.resource,
      actions: {}
    };

    privilege.actions.map(function(name) {
      grant.actions[name] = inflateAction(name);
    });
    res.grants.push(grant);
  });
  return res;
};

module.exports = {
  ACTIONS: ACTIONS,
  ROLES: ROLES,
  inflate: inflate,
  filterResources: filterResources,
  getResourcesWithActions: getResourcesWithActions
};
