var legalEagle = require('legal-eagle');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');

function list(options, done) {
  legalEagle(options, function(err, res) {
    if (err) {
      return done(err);
    }

    var deps = _.chain(res).map(function(d, id) {
      var p = id.split('@');
      _.extend(d, {
        id: id,
        name: p[0],
        version: p[1]
      });
      if (d.repository) {
        d.url = d.repository
          .replace('git+ssh', 'https')
          .replace('git+https', 'https')
          .replace('https://git@', 'https://');
      }
      return d;
    })
      .sortBy(function(d) {
        return d.license + d.id;
      })
      .value();

    done(null, deps);
  });
}


/**
 * Report the licenses of all dependencies.
 *
 * @param {Object} opts
 * @param {Function} done
 */
module.exports.check = function(opts, done) {
  _.defaults(opts, {
    path: process.cwd(),
    omitPermissive: true,
    overrides: {}
  });

  list(opts, done);
};

/**
 * Get the licenses of all dependencies.
 *
 * @param {Object} opts
 * @param {Function} done
 */
module.exports.list = function(opts, done) {
  _.defaults(opts, {
    path: process.cwd(),
    overrides: {}
  });

  list(opts, done);
};

/**
 * Build the contents of `LICENSE.md` to include
 *
 * @param {Object} opts
 * @param {Function} done
 */
module.exports.build = function(opts, done) {
  _.defaults(opts, {
    path: process.cwd(),
    overrides: {}
  });

  fs.readFile(path.join(opts.path, 'LICENSE'), 'utf-8', function(err, appLicense) {
    if (err) {
      return done(err);
    }

    fs.readFile(path.join(__dirname, '..', 'LICENSE.tpl.md'), 'utf-8', function(tplErr, tpl) {
      if (tplErr) {
        return done(tplErr);
      }

      list(opts, function(listErr, deps) {
        if (listErr) {
          return done(listErr);
        }

        var ctx = {
          app_license: appLicense,
          deps: deps
        };

        var res = _.template(tpl)(ctx);
        done(null, res);
      });
    });
  });
};
