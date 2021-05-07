import React from 'react';
import {object, isFunction} from './utils.js';

const componentRef = '__CONNECTED_COMPONENT_REF__';

export default function (store, key) {
  let noKey = key === undefined;

  return function (Component) {
    //if no explicit state declaration in 'constructor'
    Component.prototype.state = {};

    return class ConnectorWrapper extends React.Component {

      componentDidMount() {
        let findInnerComponent = function (instance){
          //recursively find inner most 'real react component', allowing multiple decorators
          if (instance.refs[componentRef]){return findInnerComponent(instance.refs[componentRef]); }
          return instance;
        };
        let componentInstance = findInnerComponent(this.refs[componentRef]);

        let setStateFunc = state => {
          let newState = noKey ? state : object([key], [state]);
          componentInstance.setState(newState);
        };

        //setting `initialState` after Component's constructor method (where: `state={...}`)
        if (!isFunction(store.getInitialState)) {
          console.warn('component ' + Component.name + ' is trying to connect to a store that lacks "getInitialState()" method');
          return;
        } else {
          let state = noKey ? store.state : store.state[key];
          setStateFunc(state);
        }

        let listener = noKey ? store : store[key];

        this.unsubscribe = listener.listen(setStateFunc);
      }

      componentWillUnmount() { this.unsubscribe(); }

      render() {
        return (
            <Component
                ref={componentRef}
                {...this.props}
                />

        );
      }
    };
  };
}
