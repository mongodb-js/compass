import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import pluralize from 'pluralize';
import numeral from 'numeral';

class ArrayMinichart extends Component {
  static displayName = 'ArrayMiniChartComponent';

  static propTypes = {
    type: PropTypes.object.isRequired,
    nestedDocType: PropTypes.object
  }

  render() {
    let arrayOfFieldsMessage = '';
    if (this.props.nestedDocType) {
      const numFields = _.get(this.props.nestedDocType.fields, 'length', 0);
      const nestedFields = pluralize('nested field', numFields, true);
      arrayOfFieldsMessage = `Array of documents with ${nestedFields}.`;
    }

    const minLength = _.min(this.props.type.lengths);
    const averageLength = numeral(this.props.type.average_length).format('0.0[0]');
    const maxLength = _.max(this.props.type.lengths);

    return (
      <div>
        <dl>
          <dt>{arrayOfFieldsMessage}</dt>
          <dd></dd>
          <dt>Array lengths</dt>
          <dd>
            <ul className="list-inline">
              <li>min: {minLength}</li>
              <li>average: {averageLength}</li>
              <li>max: {maxLength}</li>
            </ul>
          </dd>
        </dl>
      </div>
    );
  }
}

export default ArrayMinichart;
