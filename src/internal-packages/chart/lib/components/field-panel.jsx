const React = require('react');
const PropTypes = require('prop-types');
const FieldPanelItem = require('./field-panel-item');

class FieldPanel extends React.Component {

  renderFields() {
    if (!this.props.rootFields) {
      return null;
    }

    return this.props.rootFields.map((fieldPath) => {
      const nestedFields = this.props.fieldsCache[fieldPath].hasOwnProperty('nestedFields')
        ? this.props.fieldsCache[fieldPath].nestedFields : null;
      return (
        <FieldPanelItem key={fieldPath}
          fieldsCache={this.props.fieldsCache}
          fieldPath={fieldPath}
          nestedFields={nestedFields}
        />
      );
    });
  }

  render() {
    return (
      <div
        className="chart-builder-field-panel"
        data-test-id="chart-builder-field-panel"
      >
        {this.renderFields()}
      </div>
    );
  }
}

FieldPanel.propTypes = {
  fieldsCache: PropTypes.object,
  rootFields: PropTypes.array,
  actions: PropTypes.object
};

FieldPanel.defaultProps = {
  fieldsCache: {},
  rootFields: []
};

FieldPanel.displayName = 'FieldPanel';

module.exports = FieldPanel;
