'use strict';

/**
 * Constants for routes.
 */
const Routes = {
  '/instance': 'instance',
  '/deployments': 'deployments',
  '/deployments/:deploymentId': 'deployment',
  '/databases/:database': 'database',
  '/collections/:ns': 'collection',
  '/collections/:ns/count': 'count',
  '/collections/:ns/find': 'find',
  '/collections/:ns/aggregate': 'aggregate'
};

/**
 * Optional parameter regex.
 */
const OPTIONAL_PARAMETER = /\((.*?)\)/g;

/**
 * Named parameter regex.
 */
const NAMED_PARAMETER = /(\(\?)?:\w+/g;

/**
 * Splat parameter regex.
 */
const SPLAT_PARAMETER = /\*\w+/g;

/**
 * Escaping regex.
 */
const ESCAPE = /[\-{}\[\]+?.,\\\^$|#\s]/g;

/**
 * The router handles the mapping of urls to service methods.
 */
class Router {

  /**
   * Instantiate the Router.
   */
  constructor() {
    this.routes = [];
    this.init();
  }

  /**
   * Initialize the Router, called in the constructor.
   *
   * @api private
   */
  init() {
    Object.keys(Routes).map((spec) => {
      var regex = spec
        .replace(ESCAPE, '\\$&')
        .replace(OPTIONAL_PARAMETER, '(?:$1)?')
        .replace(NAMED_PARAMETER, (match, optional) => {
          return optional ? match : '([^/?]+)';
        })
        .replace(SPLAT_PARAMETER, '([^?]*?)');
      this.routes.push({
        spec: spec,
        method: Routes[spec],
        regex: new RegExp('^' + regex + '(?:\\?([\\s\\S]*))?$')
      });
    });
  }

  /**
   * Get the params for the route and current fragment.
   *
   * @param {String} route - The route.
   * @param {String} fragment - The URL fragment.
   *
   * @returns {Array} The parameters.
   */
  params(route, fragment) {
    var p = route.regex.exec(fragment).slice(1);
    if (!p[0]) {
      return [];
    }
    return p.map((param, i) => {
      if (i === p.length - 1) {
        return param || null;
      }
      return param ? decodeURIComponent(param) : null;
    }).filter((v) => {
      return v !== null;
    });
  }

  /**
   * Resolve the route for the provided URL fragment.
   *
   * @param {String} fragment - The URL fragment.
   *
   * @return {Object} The route object.
   */
  resolve(fragment) {
    var route = null;
    this.routes.every((rule) => {
      if (rule.regex.test(fragment)) {
        route = { method: rule.method, args: this.params(rule, fragment) };
        return false;
      }
      return true;
    });
    if (!route) {
      throw new Error(`No route found for ${fragment}`);
    }
    return route;
  }
}

module.exports = Router;
module.exports.Routes = Routes;
