/* eslint react/no-multi-comp:0 */
const React = require('react');
const PropTypes = require('prop-types');
const DraggableField = require('./draggable-field');

class FieldGroup extends React.Component {

  renderFields() {
    return this.props.nestedFields.map((fieldPath) => {
      const nestedFields = this.props.fieldsCache[fieldPath].hasOwnProperty('nestedFields')
        ? this.props.fieldsCache[fieldPath].nestedFields : null;

      return (
        <FieldPanelItem key={fieldPath}
          fieldsCache={this.props.fieldsCache}
          fieldPath={fieldPath}
          nestedFields={nestedFields}
          disabled={this.props.disabled}
        />
      );
    });
  }

  render() {
    return (
      <div className="chart-builder-field-panel-group">
        <div className="chart-builder-field-panel-group-label">
          {this.props.fieldsCache[this.props.fieldPath].name}
        </div>
        <div className="chart-builder-field-group-fields">
          {this.renderFields()}
        </div>
      </div>
    );
  }
}

FieldGroup.propTypes = {
  fieldPath: PropTypes.string,
  fieldsCache: PropTypes.object,
  nestedFields: PropTypes.array,
  disabled: PropTypes.bool
};

FieldGroup.defaultProps = {
  fieldPath: '',
  fieldsCache: {},
  nestedFields: []
};

FieldGroup.displayName = 'FieldGroup';

class FieldPanelItem extends React.Component {

  renderFields() {
    const isArray = this.props.disabled || this.props.fieldsCache[this.props.fieldPath].type === 'Array';
    const view =
      this.props.nestedFields ?
        (<FieldGroup
          key={this.props.fieldPath}
          fieldsCache={this.props.fieldsCache}
          fieldPath={this.props.fieldPath}
          nestedFields={this.props.nestedFields}
          disabled={isArray}
        />)
        :
        (<DraggableField
          key={this.props.fieldPath}
          fieldPath={this.props.fieldPath}
          fieldName={this.props.fieldsCache[this.props.fieldPath].name}
          disabled={isArray}
        />);

    return view;
  }

  render() {
    return (
      <div>
        {this.renderFields()}
      </div>
    );
  }
}

FieldPanelItem.propTypes = {
  fieldPath: PropTypes.string,
  fieldsCache: PropTypes.object,
  nestedFields: PropTypes.array,
  disabled: PropTypes.bool
};

FieldPanelItem.defaultProps = {
  fieldPath: '',
  fieldsCache: {},
  nestedFields: []
};

FieldPanelItem.displayName = 'FieldPanelItem';
module.exports = FieldPanelItem;
