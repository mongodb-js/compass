const React = require('react');
const CollectionStatsItem = require('./collection-stats-item');
const CollectionStatsStore = require('../store');

/**
 * The base list class.
 */
const BASE_CLASS = 'collection-stats';

/**
 * The list class.
 */
const LIST_CLASS = 'collection-stats-list';

/**
 * The invalid text.
 */
const INVALID = 'N/A';

/**
 * Documents constant.
 */
const DOCUMENTS = 'Documents';

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
  documentCount: 'N/A',
  totalDocumentSize: 'N/A',
  avgDocumentSize: 'N/A',
  indexCount: 'N/A',
  totalIndexSize: 'N/A',
  avgIndexSize: 'N/A'
};

/**
 * The collection stats component.
 */
class CollectionStats extends React.Component {

  /**
   * Instantiate the component.
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
   */
  handleStatsLoad(stats) {
    this.setState(stats || DEFAULT_STATS);
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={BASE_CLASS}>
        <ul className={LIST_CLASS}>
          <CollectionStatsItem label={DOCUMENTS} value={this.state.documentCount} primary />
          <CollectionStatsItem label={TOTAL_SIZE} value={this.state.totalDocumentSize} />
          <CollectionStatsItem label={AVG_SIZE} value={this.state.avgDocumentSize} />
        </ul>
        <ul className={LIST_CLASS}>
          <CollectionStatsItem label={INDEXES} value={this.state.indexCount} primary />
          <CollectionStatsItem label={TOTAL_SIZE} value={this.state.totalIndexSize} />
          <CollectionStatsItem label={AVG_SIZE} value={this.state.avgIndexSize} />
        </ul>
      </div>
    );
  }
}

CollectionStats.displayName = 'CollectionStats';

module.exports = CollectionStats;
