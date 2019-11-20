import { Tooltip } from 'hadron-react-components';
import ExportField from 'components/export-field';
import styles from './export-select-fields.less';
import { FIELDS } from 'constants/export-step';
import createStyler from 'utils/styler.js';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';


const style = createStyler(styles, 'export-select-fields');

const fieldInfoSprinkle = 'The fields displayed are from a sample of documents in the collection. To ensure all fields are exported, add missing field names.';

class ExportSelectFields extends PureComponent {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    exportStep: PropTypes.string.isRequired,
    updateFields: PropTypes.func.isRequired,
  };

  handleFieldCheckboxChange = (evt) => {
    const fields = Object.assign({}, this.props.fields);
    fields[`${evt.target.name}`] ^= 1; // flip 1/0 to its opposite
    this.props.updateFields(fields);
  }

  handleHeaderCheckboxChange = () => {
    const fields = Object.assign({}, this.props.fields);

    if (this.isEveryFieldChecked()) {
      Object.keys(fields).map(f => (fields[f] = 0));
    } else {
      Object.keys(fields).map(f => (fields[f] = 1));
    }

    this.props.updateFields(fields);
  }

  isEveryFieldChecked() {
    const fields = this.props.fields;

    return Object.keys(fields).every(f => fields[f] === 1);
  }

  renderFieldRows() {
    return Object.keys(this.props.fields).map((field, index) => (
      <ExportField
        key={index}
        field={field}
        index={index}
        checked={this.props.fields[field]}
        onChange={this.handleFieldCheckboxChange}/>
    ));
  }

  render() {
    if (this.props.exportStep !== FIELDS) return null;

    return (
      <div>
        <div className={style('caption')}>
          <p>Select Fields</p>
          <div data-place="top"
            data-for="field-tooltip"
            data-tip={fieldInfoSprinkle}>
            <i className="fa fa-info-circle" />
            <Tooltip id="field-tooltip" />
          </div>
        </div>
        <div className={style('field-wrapper')}>
          <table className={style('table')}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    name="Select All"
                    checked={this.isEveryFieldChecked()}
                    onChange={this.handleHeaderCheckboxChange}/>
                </th>
                <th>&nbsp;</th>
                <th colSpan="2" className={style('field-name')}>Field Name</th>
              </tr>
            </thead>
            <tbody>
              {this.renderFieldRows()}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ExportSelectFields;
