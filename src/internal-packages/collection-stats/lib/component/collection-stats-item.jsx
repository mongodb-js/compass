const React = require('react');
const PropTypes = require('prop-types');

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
        <div className={this.props.primary ? PRIMARY_LABEL : LABEL}>
          {this.props.label}
        </div>
        <div className={this.props.primary ? PRIMARY_VALUE : VALUE}>
          {this.props.value}
        </div>
      </li>
    );
  }
}

CollectionStatsItem.displayName = 'CollectionStatsItem';

CollectionStatsItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  primary: PropTypes.bool
};

module.exports = CollectionStatsItem;
