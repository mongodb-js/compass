const React = require('react');
const PropTypes = require('prop-types');
const pluralize = require('pluralize');
const _ = require('lodash');

class DocumentMinichart extends React.Component {
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
          <dd />
        </dl>
      </div>
    );
  }
}

DocumentMinichart.propTypes = {
  nestedDocType: PropTypes.object
};

module.exports = DocumentMinichart;
