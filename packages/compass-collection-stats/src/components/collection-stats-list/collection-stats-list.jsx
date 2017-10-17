import React, { Component } from 'react';

import CollectionStatsItem from 'components/collection-stats-item';
import CollectionStatsStore from 'stores';

import styles from './collection-stats-list.less';


/**
 * A factory method that will create an index stats item component with the
 * attributes of `options`.
 *
 * @param {Object} options
 *    items: the list of collection stats items with a `label` and `value`.
 *    defaults: the default values of each collection stat
 *    displayName: the display name.
 *
 * @return {Function} CollectionStatsList - the JSX component
 **/
const statsFactory = (options = {items: [], defaults: {}, displayName: ''}) => {
  /**
   * The collection stats component.
   */
  class CollectionStatsList extends Component {
    /**
     * Instantiate the component.
     *
     * @param {Object} props - The properties.
     */
    constructor(props) {
      super(props);
      this.state = options.defaults;
    }

    /**
     * Subscribe on mount.
     */
    componentWillMount() {
      this.unsubscribeLoad = CollectionStatsStore.listen(this.handleStatsLoad.bind(this));
    }

    /**
     * Unsubscribe on unmount.
     */
    componentWillUnmount() {
      this.unsubscribeLoad();
    }

    /**
     * Handle the loading of the collection stats.
     *
     * @param {Object} stats - The stats.
     */
    handleStatsLoad(stats) {
      this.setState(stats || options.defaults);
    }

    /**
     * Render the component.
     *
     * @returns {React.Component} The component.
     */
    render() {
      return (
      <ul className={styles.component}>
        {options.items.map((item, index) => (
          <CollectionStatsItem
            label={item.label}
            value={this.state[item.value]}
            primary={index === 0} />
        ))}
      </ul>
      );
    }
  }

  return CollectionStatsList;
};

export default statsFactory;
export { statsFactory };
