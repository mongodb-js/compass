'use strict';

var update = require('react/addons').addons.update;

var _ = {}

_.object = function (keys, vals) {
  var o = {}, i = 0;
  for (; i < keys.length; i++) {
    o[keys[i]] = vals[i];
  }
  return o;
};

_.isObject = function (obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

_.extend = function (obj) {
  if (!_.isObject(obj)) {
    return obj;
  }
  var source, prop;
  for (var i = 1, length = arguments.length; i < length; i++) {
    source = arguments[i];
    for (prop in source) {
      if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
        var propertyDescriptor = Object.getOwnPropertyDescriptor(source, prop);
        Object.defineProperty(obj, prop, propertyDescriptor);
      } else {
        obj[prop] = source[prop];
      }
    }
  }
  return obj;
};

_.isFunction = function (value) {
  return typeof value === 'function';
};

/**
 * Creates the mixin, ready for use in a store
 *
 * @param Reflux object An instance of Reflux
 * @returns {{setState: Function, init: Function}}
 */
module.exports = function stateMixin(Reflux) {

  if (typeof Reflux !== 'object' || typeof Reflux.createAction !== 'function') {
    throw new Error('Must pass reflux instance to reflux-state-mixin');
  }

  function attachAction(options, actionName) {
    if (this[actionName]) {
      console.warn(
          'Not attaching event ' + actionName + '; key already exists'
      );
      return;
    }
    this[actionName] = Reflux.createAction(options);
  }

  return {
    setState: function (state) {
      var changed = false;
      var prevState = update({}, {$merge: this.state});

      for (var key in state) {
        if (state.hasOwnProperty(key)) {
          if (this.state[key] !== state[key]) {
            this[key].trigger(state[key]);
            changed = true;
          }
        }
      }

      if (changed) {
        this.state = update(this.state, {$merge: state});

        if (_.isFunction(this.storeDidUpdate)) {
          this.storeDidUpdate(prevState);
        }

        this.trigger(this.state);
      }

    },

    init: function () {
      if (_.isFunction(this.getInitialState)) {
        this.state = this.getInitialState();
        for (var key in this.state) {
          if (this.state.hasOwnProperty(key)) {
            attachAction.call(this, this.state[key], key);
          }
        }
      }
    },

    connect: function (store, key) {
      return {
        getInitialState: function () {
          if (!_.isFunction(store.getInitialState)) {
            return {};
          } else if (key === undefined) {
            return store.state;
          } else {
            return _.object([key], [store.state[key]]);
          }
        },
        componentDidMount: function () {
          _.extend(this, Reflux.ListenerMethods);
          var noKey = key === undefined;
          var me = this,
              cb = (noKey ? this.setState : function (v) {
                if (typeof me.isMounted === "undefined" || me.isMounted() === true) {
                  me.setState(_.object([key], [v]));
                }
              }),
              listener = noKey ? store : store[key];
          this.listenTo(listener, cb);
        },
        componentWillUnmount: Reflux.ListenerMixin.componentWillUnmount
      }
    }
  }
};


