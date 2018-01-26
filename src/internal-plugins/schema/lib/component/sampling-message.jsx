const React = require('react');
const PropTypes = require('prop-types');
const { InfoSprinkle } = require('hadron-react-components');
const { shell } = require('electron');
const numeral = require('numeral');
const pluralize = require('pluralize');

/**
 * The help URLs for things like the Documents tab.
 */
const HELP_URLS = Object.freeze({
  DOCUMENTS: 'https://docs.mongodb.com/compass/master/documents/',
  SCHEMA_SAMPLING: 'https://docs.mongodb.com/compass/current/faq/#what-is-sampling-and-why-is-it-used'
});

/**
 * Component for the sampling message.
 */
class SamplingMessage extends React.Component {

  _samplePercentage() {
    const percent = (this.props.count === 0) ? 0 : this.props.sampleSize / this.props.count;
    return numeral(percent).format('0.00%');
  }

  /**
   * If we are on the schema tab, the smapling message is rendered.
   *
   * @returns {React.Component} The sampling message.
   */
  render() {
    const noun = pluralize('document', this.props.count);
    return (
      <div className="sampling-message">
        Query returned&nbsp;
        <b>{this.props.count}</b>&nbsp;{noun}.
        This report is based on a sample of&nbsp;
        <b>{this.props.sampleSize}</b>&nbsp;{noun} ({this._samplePercentage()}).
        <InfoSprinkle
          helpLink={HELP_URLS.SCHEMA_SAMPLING}
          onClickHandler={shell.openExternal}
        />
      </div>
    );
  }
}

SamplingMessage.displayName = 'SamplingMessage';

SamplingMessage.propTypes = {
  sampleSize: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired
};

module.exports = SamplingMessage;
