const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const app = require('hadron-app');

const actions = require('../actions');

/**
 * The base list class.
 */
const BASE_CLASS = 'collection-stats';

/**
 * The collection stats component.
 */
class CollectionStats extends React.Component {

  /**
   * Instantiate the component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.setupStatsItems();
  }

  componentWillReceiveProps(nextProps) {
    actions.loadCollectionStats(nextProps.namespace, nextProps.isReadonly);
  }

  setupStatsItems() {
    actions.loadCollectionStats(this.props.namespace, this.props.isReadonly);
    const roles = app.appRegistry.getRole('CollectionHUD.Item');
    const views = _.map(roles, (role) => {
      return React.createElement(role.component, {key: _.uniqueId()});
    });
    this.views = views;
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   *
   */
  render() {
    return (
      <div className={BASE_CLASS}>
        {this.views}
      </div>
    );
  }
}

CollectionStats.propTypes = {
  namespace: PropTypes.string,
  isReadonly: PropTypes.bool
};

CollectionStats.displayName = 'CollectionStats';

module.exports = CollectionStats;
