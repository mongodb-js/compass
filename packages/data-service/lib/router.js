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
  '/collections/:ns/indexes': 'indexes',
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
    this._init();
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
        route = { method: rule.method, args: this._params(rule, fragment) };
        return false;
      }
      return true;
    });
    if (!route) {
      throw new Error(`No route found for ${fragment}`);
    }
    return route;
  }

  /**
   * Initialize the Router, called in the constructor.
   *
   * This sets the routes as an object with spec, method, and regex keys.
   */
  _init() {
    Object.keys(Routes).map((spec) => {
      var regex = this._parse(spec);
      this.routes.push({
        spec: spec,
        method: Routes[spec],
        regex: new RegExp('^' + regex + '(?:\\?([\\s\\S]*))?$')
      });
    });
  }

  /**
   * Parse the specification.
   *
   * @param {String} spec - The route specification.
   *
   * @returns {Regex} The regular expression to match the spec.
   */
  _parse(spec) {
    return spec
      .replace(ESCAPE, '\\$&')
      .replace(OPTIONAL_PARAMETER, '(?:$1)?')
      .replace(NAMED_PARAMETER, (match, optional) => {
        return optional ? match : '([^/?]+)';
      })
      .replace(SPLAT_PARAMETER, '([^?]*?)');
  }

  /**
   * Get the params for the route and current fragment.
   *
   * @param {String} route - The route.
   * @param {String} fragment - The URL fragment.
   *
   * @returns {Array} The parameters.
   */
  _params(route, fragment) {
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

}

module.exports = Router;
module.exports.Routes = Routes;
