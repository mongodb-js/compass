const React = require('react');
const numeral = require('numeral');

// const debug = require('debug')('mongodb-compass:collection:stats:dev');

const labels = [
  'document_count',
  'document_size',
  'document_size_average',
  'index_count',
  'index_size',
  'index_size_average'
];

class CollectionStats extends React.Component {

  _format(propertyName, value) {
    // check for NaN
    value = Number.isNaN(value) ? 0 : value;
    const precision = value <= 1000 ? '0' : '0.0';
    const format = propertyName.indexOf('_size') > -1 ? ' b' : 'a';
    return numeral(value).format(precision + format);
  }

  /**
   * Connect <Validation /> component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="collection-stats-holder">
        <ul className="collection-stats">
          <li className="collection-stats-item">
            <div className="collection-stats-primary-label">Documents</div>
            <div className="collection-stats-primary-value">
              {this._format(labels[0], this.props.document_count)}
            </div>
          </li>
          <li className="collection-stats-item">
            <div className="collection-stats-label">total size</div>
            <div className="collection-stats-value">
              {this._format(labels[1], this.props.document_size)}
            </div>
          </li>
          <li className="collection-stats-item">
            <div className="collection-stats-label">avg. size</div>
            <div className="collection-stats-value">
              {this._format(labels[2], this.props.document_size / this.props.document_count)}
            </div>
          </li>
        </ul>
        <ul className="collection-stats">
          <li className="collection-stats-item">
            <div className="collection-stats-primary-label">Indexes</div>
            <div className="collection-stats-primary-value">
              {this._format(labels[3], this.props.index_count)}
            </div>
          </li>
          <li className="collection-stats-item">
            <div className="collection-stats-label">total size</div>
            <div className="collection-stats-value">
              {this._format(labels[4], this.props.index_size)}
            </div>
          </li>
          <li className="collection-stats-item">
            <div className="collection-stats-label">avg. size</div>
            <div className="collection-stats-value">
              {this._format(labels[5], this.props.index_size / this.props.index_count)}
            </div>
          </li>
        </ul>
      </div>
    );
  }
}

CollectionStats.propTypes = {
  document_count: React.PropTypes.number.isRequired,
  document_size: React.PropTypes.number.isRequired,
  index_count: React.PropTypes.number.isRequired,
  index_size: React.PropTypes.number.isRequired
};

CollectionStats.defaultProps = {
  document_count: 0,
  document_size: 0,
  index_count: 0,
  index_size: 0
};

CollectionStats.displayName = 'CollectionStats';

module.exports = CollectionStats;
