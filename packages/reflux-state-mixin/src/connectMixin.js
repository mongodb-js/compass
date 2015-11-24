import utils from './utils.js';

module.exports = function (store, key) {
  var noKey = key === undefined;

  return {
    getInitialState: function () {
      if (!utils.isFunction(store.getInitialState)) {
        console.warn('component ' + this.constructor.displayName + ' is trying to connect to a store that lacks "getInitialState()" method');
        return {};
      } else {
        return noKey ? store.state : utils.object([key], [store.state[key]]);
      }
    },
    componentDidMount: function () {

      var componentInstance = this;

      let setStateFunc = state => {
        let newState = noKey ? state : utils.object([key], [state]);

        if (typeof componentInstance.isMounted === "undefined" || componentInstance.isMounted() === true) {
          componentInstance.setState(newState);
        }
      };

      let listener = noKey ? store : store[key];

      this.unsubscribe = listener.listen(setStateFunc);

    },
    componentWillUnmount: function(){this.unsubscribe();}
  }
};