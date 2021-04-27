import React from 'react';
import PropTypes from 'prop-types';
import isFunction from 'lodash.isfunction';

/**
 * Connects a store to a component where the store state matches
 * the component state.
 */
class StoreConnector extends React.Component {
  constructor(props) {
    super(props);
    // warn if the store does not have a getInitialState() method
    if (!isFunction(props.store.getInitialState)) {
      /* eslint no-console: 0 */
      console.warn('component ' + this.constructor.displayName +
        ' is trying to connect to a store that lacks a "getInitialState()" method');
      this.state = {};
    } else {
      this.state = props.store.state;
    }
  }

  /**
   * subscribe to changes from the store.
   */
  componentDidMount() {
    this.unsubscribe = this.props.store.listen(this.setState.bind(this));
  }

  /**
   * unsubscribe from changes to the store.
   */
  componentWillUnmount() {
    this.unsubscribe();
  }

  /**
   * render a shallow clone of the children and pass in the state as props.
   *
   * @return {React.Element}  shallow clone of the child element.
   */
  render() {
    return React.cloneElement(this.props.children, this.state);
  }
}

StoreConnector.propTypes = {
  store: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired
};

StoreConnector.displayName = 'StoreConnector';

export default StoreConnector;
