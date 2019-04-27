import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { InfoSprinkle } from 'hadron-react-components';
import numeral from 'numeral';
import pluralize from 'pluralize';

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
class SamplingMessage extends Component {
  static displayName = 'SamplingMessageComponent';

  static propTypes = {
    sampleSize: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  }

  _samplePercentage() {
    const percent = (this.props.count === 0) ? 0 : this.props.sampleSize / this.props.count;
    return numeral(percent).format('0.00%');
  }

  _openLink(link) {
    const { shell } = require('electron');
    shell.openExternal(link);
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
          onClickHandler={this._openLink.bind(this)}
        />
      </div>
    );
  }
}

export default SamplingMessage;
