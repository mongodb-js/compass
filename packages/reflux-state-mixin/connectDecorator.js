import React from 'react';
import utils from './utils.js';

const componentRef = '__CONNECTED_COMPONENT_REF__';

export default function connectToStore(store, key) {
  let noKey = typeof key !== 'string';

  return function (Component) {
    return class ConnectorWrapper extends React.Component {

      componentDidMount() {
        let findInnerComponent = function (instance){
          //recursively find inner most 'real react component', aloowing multiple decorators
          if (instance.refs[componentRef]){return findInnerComponent(instance.refs[componentRef]); }
          return instance;
        };
        let componentInstance = findInnerComponent(this.refs[componentRef]);

        let setStateFunc = state => {
          let newState = noKey ? state : utils.object([key], [state]);
          componentInstance.setState(newState);
        };

        //setting `initialState` after Component's constructor method (where: `state={...}`)
        if (!utils.isFunction(store.getInitialState)) {
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
            <div>
            <Component
        ref={componentRef}
        {...this.props}
      />
      </div>

      );
      }
    };
  };
}
