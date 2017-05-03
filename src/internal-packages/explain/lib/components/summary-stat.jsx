const React = require('react');
const PropTypes = require('prop-types');
const shell = require('electron').shell;

// const debug = require('debug')('mongodb-compass:explain:summary-stat');

/**
 * React component that displays one stat in the explain plan summary section,
 * consisting of a `label` and `value`, and optionally a `dataLink` prop, which
 * if provided adds an info sprinkle button linking to the documentation.
 */
class SummaryStat extends React.Component {

  onHelpClicked(explainURL) {
    shell.openExternal(explainURL);
  }

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
      <i className="summary-stat-info-sprinkle" onClick={this.onHelpClicked.bind(this, dataLink)} data-link={dataLink}></i> : null;

    // nReturned is represented as bubble value, other stats as simple string
    const modifier = (this.props.dataLink === 'nReturned') ?
      'summary-stat-has-nreturned' : '';

    return (
      <div className={`summary-stat ${modifier}`}>
        {infoSprinkle}
        <span className="summary-stat-label">{label}</span>
        <span className="summary-stat-value" data-test-id={this.props.dataTestId}>{value}</span>
      </div>
    );
  }
}

SummaryStat.propTypes = {
  dataLink: PropTypes.string,          // info sprinkle (optional)
  label: PropTypes.string.isRequired,  // label of the stat
  value: PropTypes.any.isRequired,     // value of the stat
  dataTestId: PropTypes.string
};

SummaryStat.displayName = 'SummaryStat';

module.exports = SummaryStat;
