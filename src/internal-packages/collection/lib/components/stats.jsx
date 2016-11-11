const React = require('react');

const debug = require('debug')('mongodb-compass:collection:stats');

class CollectionStats extends React.Component {

  constructor(props) {
    super(props);
    debug('the props', props);
  }

  /**
   * Connect <Validation /> component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="stats">
      </div>
    );
  }
}

CollectionStats.displayName = 'CollectionStats';

module.exports = CollectionStats;
