const React = require('react');
const pluralize = require('pluralize');

const debug = require('debug')('mongodb-compass:schema:array');

const DocumentMinichart = React.createClass({

  propTypes: {
    nestedDocType: React.PropTypes.object
  },

  render() {
    debug('props', this.props);

    let docFieldsMessage = '';
    if (this.props.nestedDocType) {
      const numFields = this.props.nestedDocType.fields.length;
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
});

module.exports = DocumentMinichart;
