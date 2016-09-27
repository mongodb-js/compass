'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (store, key) {
  var noKey = key === undefined;

  return {
    getInitialState: function getInitialState() {
      if (!(0, _utils.isFunction)(store.getInitialState)) {
        console.warn('component ' + this.constructor.displayName + ' is trying to connect to a store that lacks "getInitialState()" method');
        return {};
      } else {
        return noKey ? store.state : (0, _utils.object)([key], [store.state[key]]);
      }
    },
    componentDidMount: function componentDidMount() {

      var componentInstance = this;

      var setStateFunc = function setStateFunc(state) {
        var newState = noKey ? state : (0, _utils.object)([key], [state]);

        if (typeof componentInstance.isMounted === "undefined" || componentInstance.isMounted() === true) {
          componentInstance.setState(newState);
        }
      };

      var listener = noKey ? store : store[key];

      this.unsubscribe = listener.listen(setStateFunc);
    },
    componentWillUnmount: function componentWillUnmount() {
      this.unsubscribe();
    }
  };
};

var _utils = require('./utils.js');

;