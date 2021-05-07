import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { InfoSprinkle } from 'hadron-react-components';
import pluralize from 'pluralize';

const SCHEMA_ANALYSIS_DOCS_LINK = 'https://docs.mongodb.com/compass/current/sampling#sampling';

/**
 * Component for the analysis message.
 */
class AnalysisCompleteMessage extends Component {
  static displayName = 'AnalysisCompleteMessageComponent';

  static propTypes = {
    sampleSize: PropTypes.number.isRequired
  }

  _openLink(link) {
    const { shell } = require('electron');
    shell.openExternal(link);
  }

  /**
   * If we are on the schema tab, the smapling message is rendered.
   *
   * @returns {React.Component} The analysis message.
   */
  render() {
    const sampleSize = this.props.sampleSize;
    const documentsNoun = pluralize('document', sampleSize);

    return (
      <div className="analysis-message">
        This report is based on a sample of&nbsp;<b>{sampleSize}</b>&nbsp;{documentsNoun}.
        <InfoSprinkle
          helpLink={SCHEMA_ANALYSIS_DOCS_LINK}
          onClickHandler={this._openLink.bind(this)}
        />
      </div>
    );
  }
}

export default AnalysisCompleteMessage;
