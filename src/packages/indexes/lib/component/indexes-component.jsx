'use strict';

const React = require('react');
const IndexStore = require('../store/index-store');

/**
 * Represents the Wrapper for the indexes modal dialog.
 */
class IndexesComponent extends React.Component {

  /**
   * Instantiates the component with the properties. Sets up initial state.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.fetchState();
  }

  /**
   * Executed when the component mounts. Sets up the store listener.
   */
  componentDidMount() {
    this.unsubscribe = IndexStore.listen(this.fetchState);
  }

  /**
   * When the component will unmount, we unsubscribe to the store.
   */
  componentWillUnmount() {
    this.unsubscribe();
  }

  /**
   * Gets the component state from the SidebarStore.
   *
   * @returns {Object} The state from the store.
   */
  fetchState() {
    IndexStore.indexes((error, indexes) => {
      this.state = { indexes: indexes };
    });
  }

  /**
   * Renders the indexes component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return (
      <div>
      </div>
    );
  }
}

/**
 * Component display names are required or react will generate a warning.
 */
IndexesComponent.displayName = 'IndexesComponent';

module.exports = IndexesComponent;
