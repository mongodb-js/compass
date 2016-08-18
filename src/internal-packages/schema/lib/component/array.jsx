const React = require('react');
const _ = require('lodash');
const pluralize = require('pluralize');
const numeral = require('numeral');

// const debug = require('debug')('mongodb-compass:schema:array');

const ArrayMinichart = React.createClass({

  propTypes: {
    type: React.PropTypes.object.isRequired,
    nestedDocType: React.PropTypes.object
  },

  render() {
    let arrayOfFieldsMessage = '';
    if (this.props.nestedDocType) {
      const numFields = this.props.nestedDocType.fields.length;
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
