/* eslint react/no-multi-comp:0 */
const React = require('react');
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
        />
      );
    });
  }

  render() {
    return (
      <div className="chart-builder-field-group">
        <div className="chart-builder-field-group-label">
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
  fieldPath: React.PropTypes.string,
  fieldsCache: React.PropTypes.object,
  nestedFields: React.PropTypes.array
};

FieldGroup.defaultProps = {
  fieldPath: '',
  fieldsCache: {},
  nestedFields: []
};

FieldGroup.displayName = 'FieldGroup';

class FieldPanelItem extends React.Component {

  renderFields() {
    const view =
      this.props.nestedFields ?
        (<FieldGroup
          key={this.props.fieldPath}
          fieldsCache={this.props.fieldsCache}
          fieldPath={this.props.fieldPath}
          nestedFields={this.props.nestedFields}
        />)
        :
        (<DraggableField key={this.props.fieldPath} fieldPath={this.props.fieldPath}
          fieldName={this.props.fieldsCache[this.props.fieldPath].name}
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
  fieldPath: React.PropTypes.string,
  fieldsCache: React.PropTypes.object,
  nestedFields: React.PropTypes.array
};

FieldPanelItem.defaultProps = {
  fieldPath: '',
  fieldsCache: {},
  nestedFields: []
};

FieldPanelItem.displayName = 'FieldPanelItem';
module.exports = FieldPanelItem;
