import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash.get';
import min from 'lodash.min';
import max from 'lodash.max';
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
      const numFields = get(this.props.nestedDocType.fields, 'length', 0);
      const nestedFields = pluralize('nested field', numFields, true);
      arrayOfFieldsMessage = `Array of documents with ${nestedFields}.`;
    }

    const minLength = min(this.props.type.lengths);
    const averageLength = numeral(this.props.type.average_length).format('0.0[0]');
    const maxLength = max(this.props.type.lengths);

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
