import React, { Component } from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import _ from 'lodash';

class DocumentMinichart extends React.Component {
  static displayName = 'DocumentMiniChartComponent';

  static propTypes = {
    nestedDocType: PropTypes.object
  }

  render() {
    let docFieldsMessage = '';
    if (this.props.nestedDocType) {
      const numFields = _.get(this.props.nestedDocType.fields, 'length', 0);
      const nestedFields = pluralize('nested field', numFields, true);
      docFieldsMessage = `Document with ${nestedFields}.`;
    }

    return (
      <div>
        <dl>
          <dt>{docFieldsMessage}</dt>
          <dd></dd>
        </dl>
      </div>
    );
  }
}

export default DocumentMinichart;
