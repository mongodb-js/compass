const React = require('react');

/**
 * The base class.
 */
const BASE_CLASS = 'collection-stats-list-item';

/**
 * The primary label class.
 */
const PRIMARY_LABEL = `${BASE_CLASS}-primary-label`;

/**
 * The primary value class.
 */
const PRIMARY_VALUE = `${BASE_CLASS}-primary-value`;

/**
 * The label class.
 */
const LABEL = `${BASE_CLASS}-label`;

/**
 * The value class.
 */
const VALUE = `${BASE_CLASS}-value`;

/**
 * Component for a single collection stats item.
 */
class CollectionStatsItem extends React.Component {

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <li className={BASE_CLASS}>
        <span className={this.props.primary ? PRIMARY_LABEL : LABEL}>
          {this.props.label}
        </span>
        <span className={this.props.primary ? PRIMARY_VALUE : VALUE}>
          {this.props.value}
        </span>
      </li>
    );
  }
}

CollectionStatsItem.displayName = 'CollectionStatsItem';

CollectionStatsItem.propTypes = {
  label: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired,
  primary: React.PropTypes.bool
};

module.exports = CollectionStatsItem;
