import React, { PureComponent } from 'react';
import createStyler from '../../utils/styler';
import styles from './export-field.module.less';
import PropTypes from 'prop-types';

const style = createStyler(styles, 'export-field');

class ExportField extends PureComponent {
  static propTypes = {
    index: PropTypes.number,
    checked: PropTypes.number,
    field: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  render() {
    return (
      <tr key={this.props.field}>
        <td>
          <input
            type="checkbox"
            id={this.props.index}
            name={this.props.field}
            checked={this.props.checked}
            onChange={this.props.onChange}
            aria-label={`Include ${this.props.field} in exported collection`}
          />
        </td>
        <td className={style('field-number')}>{this.props.index + 1}</td>
        <td>{this.props.field}</td>
      </tr>
    );
  }
}

export default ExportField;
