const React = require('react');
const _ = require('lodash');
const app = require('hadron-app');

/**
 * The base list class.
 */
const BASE_CLASS = 'collection-view-header-item collection-stats';

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

  setupStatsItems() {
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

CollectionStats.displayName = 'CollectionStats';

module.exports = CollectionStats;
