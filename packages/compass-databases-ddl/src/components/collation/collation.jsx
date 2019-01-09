import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select-plus';
import sortBy from 'lodash.sortby';
import classnames from 'classnames';
import COLLATION_OPTIONS from 'constants/collation';

import styles from './collation.less';

/**
 * The collation component.
 */
class Collation extends PureComponent {
  static displayName = 'CollationComponent';

  static propTypes = {
    collation: PropTypes.object.isRequired,
    changeCollationOption: PropTypes.func.isRequired
  }

  /**
   * Change the collation option.
   */
  onChangeCollationOption(field, value) {
    this.props.changeCollationOption(field, value);
  }

  /**
   * Create React dropdown items for each element in the fields array.
   * @param {Array} values - List of values for dropdown.
   *
   * @returns {Array} The React components for each item in the field and type dropdowns.
   */
  getDropdownFieldsSelect(values) {
    const unifiedValues = values.map((elem) => ({
      value: (typeof elem === 'object') ? elem.value : elem,
      label: (typeof elem === 'object') ? elem.label : elem
    }));
    return sortBy(unifiedValues, 'value');
  }

  /**
   * Render Collation component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const options = COLLATION_OPTIONS.map((element) => {
      console.log(element);
      return (
        <div key={element.field} className={classnames(styles['collation-field'])}>
          <p className={classnames(styles['collation-label'])}>{element.label}</p>
          <Select
            value={this.props.collation[element.field]}
            name={element.field}
            placeholder={`Select a ${element.field}`}
            options={this.getDropdownFieldsSelect(element.values)}
            onChange={this.onChangeCollationOption.bind(this, element.field)}
            className={classnames(styles['collation-select'])}
            clearable={false} />
        </div>
      );
    });

    return (
      <div className={classnames(styles.collation)}>
        {options}
      </div>
    );
  }
}

export default Collation;
