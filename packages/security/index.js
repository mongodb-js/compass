var actions = require('./res/actions.json'),
  roles = require('./res/roles.json');

function inflateAction(name){
  var def = actions[name];
  def._id = name;
  return def;
}

var special = {
  db: function(s){
    return ['local', 'config'].indexOf(s) > -1;
  },
  collection: function(s){
    return ['system.profile', 'system.indexes', 'system.js', 'system.namespaces'].indexOf(s) > -1;
  }
};

module.exports.inflate = function(userOrRole){
  // merge `privileges` and `inheritedPrivileges` into one array.
  var privileges = [];
  privileges.push.apply(privileges, userOrRole.privileges, userOrRole.inheritedPrivileges);
  privileges.sort(function(a, b){
    return a.actions.length - b.actions.length;
  });

  var res = userOrRole;
  res.grants = [];

  privileges.map(function(privilege){
    if(special.db(privilege.resource.db)){
      debug('skip special db privilege', privilege.resource);
      return false;
    }

    if(special.collection(privilege.resource.collection)){
      debug('skip special collection grant', privilege.resource);
      return false;
    }

    var grant = {
      resource: privilege.resource,
      actions: {}
    };

    privilege.actions.map(function(name){
      grant.actions[name] = expandAction(name);
    });
    res.grants.push(grant);
  });
  return res;
};
