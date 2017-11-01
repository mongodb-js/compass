const React = require('react');
const CollectionStatsItem = require('./collection-stats-item');
const CollectionStatsStore = require('../store');

/**
 * The list class.
 */
const LIST_CLASS = 'collection-stats-list';

/**
 * The invalid text.
 */
const INVALID = 'N/A';

/**
 * Indexes constant.
 */
const INDEXES = 'Indexes';

/**
 * Total size constant.
 */
const TOTAL_SIZE = 'total size';

/**
 * Average size constant.
 */
const AVG_SIZE = 'avg. size';

/**
 * The default stats state.
 */
const DEFAULT_STATS = {
  indexCount: INVALID,
  totalIndexSize: INVALID,
  avgIndexSize: INVALID
};

/**
 * The collection indexes stats component.
 */
class IndexesStatsItem extends React.Component {

  /**
   * Instantiate the component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = DEFAULT_STATS;
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
    this.setState(stats || DEFAULT_STATS);
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   *
   */
  render() {
    return (
      <div className={LIST_CLASS}>
        <CollectionStatsItem label={INDEXES} value={this.state.indexCount} primary />
        <CollectionStatsItem label={TOTAL_SIZE} value={this.state.totalIndexSize} />
        <CollectionStatsItem label={AVG_SIZE} value={this.state.avgIndexSize} />
      </div>
    );
  }
}

IndexesStatsItem.displayName = 'IndexesStatsItem';

module.exports = IndexesStatsItem;
