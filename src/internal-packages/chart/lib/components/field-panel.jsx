const React = require('react');
const PropTypes = require('prop-types');
const FieldPanelItem = require('./field-panel-item');

class FieldPanel extends React.Component {

  handleFilter(event) {
    const searchString = event.target.value;

    let re;
    try {
      re = new RegExp(searchString, 'i');
    } catch (e) {
      re = /(?:)/;
    }
  }

  renderAddIcon() {
    return 'mms-icon-add-circle chart-builder-field-panel-controls-action chart-builder-field-panel-controls-item';
  }

  renderFields() {
    if (!this.props.topLevelFields) {
      return null;
    }

    return this.props.topLevelFields.map((fieldPath) => {
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
      <div className="chart-builder-field-panel" data-test-id="chart-builder-field-panel">
        <div className="chart-builder-field-panel-controls-row">
          <h5 className="chart-builder-field-panel-controls-item chart-builder-field-panel-field-count">Fields</h5>
        </div>
        <div className="chart-builder-field-panel-controls-row">
          <i className="fa fa-search compass-sidebar-search-icon"></i>
          <input ref="filter" className="" placeholder="filter" onChange={this.handleFilter}></input>
        </div>
        {this.renderFields()}
      </div>
    );
  }
}

FieldPanel.propTypes = {
  fieldsCache: PropTypes.object,
  topLevelFields: PropTypes.array,
  actions: PropTypes.object
};

FieldPanel.defaultProps = {
  fieldsCache: {},
  topLevelFields: []
};

FieldPanel.displayName = 'FieldPanel';

module.exports = FieldPanel;
