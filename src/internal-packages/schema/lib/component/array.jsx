const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const pluralize = require('pluralize');
const numeral = require('numeral');

// const debug = require('debug')('mongodb-compass:schema:array');

const ArrayMinichart = React.createClass({

  propTypes: {
    type: PropTypes.object.isRequired,
    nestedDocType: PropTypes.object
  },

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
});

module.exports = ArrayMinichart;
