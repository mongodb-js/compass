var gulp = require('gulp'),
  _dox = require('dox'),
  fs = require('fs'),
  pkg = require('./package.json'),
  _ = require('underscore'),
  _handlebars = require('handlebars'),
  through = require('through2'),
  gutil = require('gulp-util');

var STABILITY_BADGES = {
  deprecated: '![deprecated](http://b.repl.ca/v1/stability-deprecated-red.png)',
  prototype: '![prototype](http://b.repl.ca/v1/stability-prototype-orange.png)',
  development: '![development](http://b.repl.ca/v1/stability-development-yellow.png)',
  production: '![production](http://b.repl.ca/v1/stability-production-green.png)'
};

function getApis(methods, done) {
  var apis = [];
  methods.map(function(method) {
    if (method.ignore || method.isPrivate) return;
    if (method.description.full === '@ignore') return;

    var stability,
      isProperty = false,
      params = [],
      args = [],
      opts_arg,
      group,
      options = [],
      todos = [],
      examples = [],
      streamable = false;

    if (!method.ctx) return console.error('huh?', method);

    method.tags.map(function(tag) {
      var matches;

      if (tag.type === 'param') {
        tag.optional = (tag.name.indexOf('[') === 0);
        tag.name = tag.name.replace('[', '').replace(']', '');
        if (tag.name === 'opts') {
          opts_arg = tag;
        }
        args.push(tag.name);

        return params.push(tag);
      }
      if (tag.type === 'option') {
        matches = /\{(\w+)\} (\w+) ?(.*)?/.exec(tag.string);
        tag.types = [matches[1]];
        tag.name = matches[2];
        tag.description = matches[3] || '@todo';
        return options.push(tag);
      }
      if (tag.type === 'example') {
        matches = /([\w\d\/\:\.]+) (.*)/.exec(tag.string);
        return examples.push({
          name: matches[2],
          url: matches[1]
        });
      }
      if (tag.type === 'group') return group = tag.string;
      if (tag.type === 'stability') return stability = tag.string;
      if (tag.type === 'streamable') return streamable = true;
      if (tag.type === 'todo') todos.push(tag.string);
    });

    if (!isProperty && opts_arg && options.length > 0) {
      opts_arg.description += '\n' + options.map(function(opt) {
        return '    - `' + opt.name + '` (' + opt.types.join('|') + ') ... ' + opt.description;
      }).join('\n') + '\n';
    }

    apis.push({
      name: method.ctx.name,
      group: group,
      stability: stability,
      streamable: streamable,
      description: method.description.summary,
      params: params,
      args: args,
      options: options,
      todos: todos,
      source: method.code,
      examples: examples
    });
  });

  done(null, apis);
}

function getContext(apis, done) {
  var context = _.extend(pkg, {
    apis_by_group: []
  });

  context.apis_by_group = _.chain(apis)
  .filter(function(api, i) {
    if (i === 0) return false; // @todo handle module level docs...
    if (!api.group) return false; // private or ignore
    return true;
  })
  .map(function(api) {
    return {
      name: api.name,
      group: api.group,
      args: api.args.join(', '),
      badge: STABILITY_BADGES[api.stability],
      stability: api.stability,
      description: api.description,
      hasExamples: api.examples.length > 0,
      examples: api.examples,
      hasParams: !api.isProperty && api.params.length > 0,
      params: _.map(api.params, function(d) {
        return {
          name: d.name,
          validation: d.optional ? 'optional' : 'required',
          types: d.types.join('|'),
          description: d.description ? '... ' + d.description : ''
        };
      }),
      hasTodos: api.todos.length > 0,
      todos: api.todos
    };
  })
  .groupBy('group')
  .map(function(apis, group) {
    return {
      group: group,
      apis: apis
    };
  })
  .value();
  done(null, context);
}

function dox(tpl) {
  return through.obj(function(file, enc, cb) {
    var self = this;

    function abort(err) {
      self.emit('error', err);
      return cb();
    }

    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-dox', 'Streaming not supported'));
      return cb();
    }

    gutil.log('Parsing', gutil.colors.cyan(file.path), 'with dox');

    var methods = _dox.parseComments(file.contents.toString('utf-8'), {
      raw: true
    });

    getApis(methods, function(err, apis) {
      if (err) return abort(err);

      getContext(apis, function(err, context) {
        if (err) return abort(err);

        fs.readFile(tpl, 'utf-8', function(err, buf) {
          if (err) return abort(err);
          file.base = file.cwd;
          file.path = file.base;
          console.log('rendering context', context);
          var markdown = _handlebars.compile(buf)(context);
          console.log('markdown', markdown);
          file.contents = new Buffer(markdown);

          self.push(file);
          return cb();
        });
      });
    });
  });
}

// @todo: this should be wired to a precommit hook somewhere.
gulp.task('docs', function() {
  return gulp.src('./lib/client.js')
  .pipe(dox('./README.md.hbs'))
  .pipe(gulp.dest('README.md'));
});
