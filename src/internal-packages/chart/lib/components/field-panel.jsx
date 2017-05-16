const React = require('react');
const PropTypes = require('prop-types');
const FieldPanelItem = require('./field-panel-item');

class FieldPanel extends React.Component {

  renderSearchIcon() {
    return 'fa fa-search';
  }

  renderAddIcon() {
    return 'fa fa-plus';
  }

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
        <div className="chart-builder-field-panel-controls-row">
          <h5 className="chart-builder-field-panel-controls-item chart-builder-field-panel-field-count">72 Fields</h5>
          <button className="chart-builder-field-panel-controls-action chart-builder-field-panel-controls-item btn btn-default btn-xs" title="Add calculated field"><i className={this.renderAddIcon()} aria-hidden="true"></i></button>
          <button className="chart-builder-field-panel-controls-action chart-builder-field-panel-controls-item btn btn-default btn-xs" title="Search fields"><i className={this.renderSearchIcon()} aria-hidden="true"></i></button>
        </div>
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
