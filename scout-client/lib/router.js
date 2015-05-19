// ## Stateful API
//
// Makes client apps so much simpler because they need extremely little domain
// logic to use the hell out of an api. For usage examples, see the
// [backbone.js adapter](/lib/backbone.js).
module.exports = function(def){
  var _routes = [],
    optionalParam = /\((.*?)\)/g,
    namedParam = /(\(\?)?:\w+/g,
    splatParam = /\*\w+/g,
    escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  Object.keys(def).map(function(spec){
    var regex = spec.replace(escapeRegExp, '\\$&')
       .replace(optionalParam, '(?:$1)?')
       .replace(namedParam, function(match, optional){
         return optional ? match : '([^/?]+)';
       })
       .replace(splatParam, '([^?]*?)');

    _routes.push({
      spec: spec,
      method: def[spec],
      regex: new RegExp('^' + regex + '(?:\\?([\\s\\S]*))?$')
    });
  });

  function params(route, fragment){
    var p = route.regex.exec(fragment).slice(1);
    if(!p[0]){
      return [];
    }
    return p.map(function(param, i){
      if (i === p.length - 1) return param || null;
      return param ? decodeURIComponent(param) : null;
    }).filter(function(v){
      return v !== null;
    });
  }

  return {
    resolve: function(fragment){
      var route = null;

      _routes.every(function(rule){
        if(rule.regex.test(fragment)){
          route = {
            method: rule.method,
            args: params(rule, fragment)
          };
          return false;
        }
        return true;
      });


      if(!route){
        throw new Error('No route found for: ' + fragment);
      }
      return route;
    }
  };
};
