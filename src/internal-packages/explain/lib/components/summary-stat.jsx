const React = require('react');

// const debug = require('debug')('mongodb-compass:explain:summary-stat');

/**
 * React component that displays one stat in the explain plan summary section,
 * consisting of a `label` and `value`, and optionally a `dataLink` prop, which
 * if provided adds an info sprinkle button linking to the documentation.
 */
class SummaryStat extends React.Component {

  /**
   * Render single summary stat (key value pair).
   *
   * @returns {React.Component} One stat of the summary part.
   */
  render() {
    const label = this.props.label;
    const value = String(this.props.value);
    const dataLink = this.props.dataLink;

    // only render info sprinkle if data link was provided
    const infoSprinkle = dataLink ?
      <i className="summary-stat-info-sprinkle" data-link={dataLink}></i> : null;

    // nReturned is represented as bubble value, other stats as simple string
    const modifier = (this.props.dataLink === 'nReturned') ?
      'summary-stat-has-nreturned' : '';

    return (
      <div className={`summary-stat ${modifier}`}>
        {infoSprinkle}
        <span className="summary-stat-label">{label}</span>
        <span className="summary-stat-value">{value}</span>
      </div>
    );
  }
}

SummaryStat.propTypes = {
  dataLink: React.PropTypes.string,          // info sprinkle (optional)
  label: React.PropTypes.string.isRequired,  // label of the stat
  value: React.PropTypes.any.isRequired      // value of the stat
};

SummaryStat.displayName = 'SummaryStat';

module.exports = SummaryStat;
