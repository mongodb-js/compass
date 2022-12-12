import React from 'react';
import type Reflux from 'reflux';

type StoreConnectorProps = {
  children: React.ReactElement;
  store: Reflux.Store & {
    getInitialState: () => unknown;
  };
};

/**
 * NOTE: This is a legacy component. Not recommended for new usage.
 *
 * Connects our legacy reflux stores to a component's state so we can
 * use it for wrapping components and accepting a store's state as props.
 */
class StoreConnector extends React.Component<StoreConnectorProps> {
  // We use the non-recommended `Function` type here as reflux's types use it.
  // eslint-disable-next-line @typescript-eslint/ban-types
  unsubscribe?: Function;

  constructor(props: StoreConnectorProps) {
    super(props);

    this.state = props.store.state;
  }

  /**
   * Subscribe to changes from the store.
   * This causes a render of the component on store changes so that
   * the props are passed down to the children components.
   */
  componentDidMount() {
    this.unsubscribe = this.props.store.listen(
      this.setState.bind(this),
      undefined
    );
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  render() {
    return React.cloneElement(this.props.children, this.state);
  }
}

export { StoreConnector };
