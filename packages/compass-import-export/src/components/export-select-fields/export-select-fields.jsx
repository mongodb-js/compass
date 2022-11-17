import ExportField from '../export-field';
import styles from './export-select-fields.module.less';
import { FIELDS } from '../../constants/export-step';
import React, { PureComponent } from 'react';
import createStyler from '../../utils/styler';
import PropTypes from 'prop-types';
import {
  Body,
  Button,
  Icon,
  css,
  spacing,
  Label,
} from '@mongodb-js/compass-components';

const style = createStyler(styles, 'export-select-fields');

const selectFieldsStyles = css({
  display: 'flex',
  gap: spacing[1],
  alignItems: 'center',
});

const headerContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: spacing[3],
  marginTop: spacing[3],
  gap: spacing[2],
});

const checkboxContainerStyle = css({
  display: 'flex',
});

class ExportSelectFields extends PureComponent {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    exportStep: PropTypes.string.isRequired,
    updateSelectedFields: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.newFieldRef = React.createRef();
  }

  state = { addingFields: false };

  componentDidUpdate() {
    if (this.state.addingFields) {
      this.newFieldRef.current.scrollIntoView();
      this.newFieldRef.current.focus();
    }
  }

  addNewFieldButton = () => {
    this.newFieldRef.current.scrollIntoView();
    this.newFieldRef.current.focus();
    this.setState({ addingFields: true });
  };

  handleFieldCheckboxChange = (evt) => {
    const fields = Object.assign({}, this.props.fields);
    fields[`${evt.target.name}`] ^= 1; // flip 1/0 to its opposite
    this.props.updateSelectedFields(fields);
  };

  handleHeaderCheckboxChange = () => {
    const fields = Object.assign({}, this.props.fields);

    if (this.isEveryFieldChecked()) {
      Object.keys(fields).map((f) => (fields[f] = 0));
    } else {
      Object.keys(fields).map((f) => (fields[f] = 1));
    }

    this.props.updateSelectedFields(fields);
  };

  handleInputOnBlur = () => {
    this.setState({ addingFields: false });
  };

  handleAddFieldSubmit = (evt) => {
    if (evt.key === 'Enter') {
      const obj = {};
      obj[evt.target.value] = 1;
      // assign current entry to the end of the fields list
      const fields = Object.assign({}, this.props.fields, obj);

      this.props.updateSelectedFields(fields);
      // this will trigger 'componentDidMount()` which focuses on input field to
      // keep adding missing fields
      this.setState({ addingFields: true });
    }
  };

  isEveryFieldChecked() {
    const fields = this.props.fields;

    return Object.keys(fields).every((f) => fields[f] === 1);
  }

  renderFieldRows() {
    return Object.keys(this.props.fields).map((field, index) => (
      <ExportField
        key={index}
        field={field}
        index={index}
        checked={this.props.fields[field]}
        onChange={this.handleFieldCheckboxChange}
      />
    ));
  }

  renderEmptyField() {
    const fieldsLen = Object.keys(this.props.fields).length;

    return (
      <tr key={`new-field ${fieldsLen}`}>
        <td />
        <td className={style('field-number')}>{fieldsLen + 1}</td>
        <td>
          <input
            type="text"
            ref={this.newFieldRef}
            placeholder="Add field"
            onBlur={this.handleInputOnBlur}
            className={style('add-field-input')}
            onKeyDown={this.handleAddFieldSubmit}
          />
          <div className={style('return-symbol')}>
            <i className="fa fa-level-down fa-rotate-90" />
            <p>to add</p>
          </div>
        </td>
      </tr>
    );
  }

  render() {
    if (this.props.exportStep !== FIELDS) return null;

    return (
      <div>
        <div className={headerContainerStyles}>
          <div className={selectFieldsStyles}>
            <Label>Select Fields</Label>
          </div>
          <Body>
            The fields displayed are from a sample of documents in the
            collection. To ensure all fields are exported, add missing field
            names.
          </Body>
          <div>
            <Button
              variant="primary"
              leftGlyph={<Icon glyph="Plus" />}
              size="xsmall"
              onClick={this.addNewFieldButton}
            >
              Add new field
            </Button>
          </div>
        </div>

        <div className={style('field-wrapper')}>
          <table className={style('table')}>
            <thead>
              <tr>
                <th>
                  <div className={checkboxContainerStyle}>
                    <input
                      type="checkbox"
                      name="Select All"
                      checked={this.isEveryFieldChecked()}
                      onChange={this.handleHeaderCheckboxChange}
                    />
                  </div>
                </th>
                <th>&nbsp;</th>
                <th colSpan="2" className={style('field-name')}>
                  Field Name
                </th>
              </tr>
            </thead>
            <tbody>
              {this.renderFieldRows()}
              {this.renderEmptyField()}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ExportSelectFields;
