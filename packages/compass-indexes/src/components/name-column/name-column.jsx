import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import map from 'lodash.map';

import classnames from 'classnames';
import styles from './name-column.less';

/**
 * Component for the name column.
 */
class NameColumn extends PureComponent {
  static displayName = 'NameColumn';

  static propTypes = {
    index: PropTypes.object.isRequired
  };

  /**
   * Render the direction of the index field.
   *
   * @param {Object} field - The field.
   *
   * @returns {React.Component} The field component.
   */
  renderDirection(field) {
    if (field.value === 1) {
      return (
        <span className={classnames(styles['name-column-definition-type-pair-field-sort'])}>
          <i className="fa fa-arrow-circle-up fa-lg" />
        </span>
      );
    } else if (field.value === -1) {
      return (
        <span className={classnames(styles['name-column-definition-type-pair-field-sort'])}>
          <i className="fa fa-arrow-circle-down fa-lg" />
        </span>
      );
    }
    return (
      <span className={classnames(styles['name-column-definition-type-pair-field-type'])}>
        {field.value._bsontype ? this.renderBsonValue(field.value) : field.value}
      </span>
    );
  }

  /**
   * Render the bson value.
   *
   * @param {Object} value - The value.
   * @returns {*}
   */
  renderBsonValue(value) {
    if (value._bsontype === 'Decimal128') {
      return value.toString();
    } else if (value._bsontype === 'Int32') {
      return value.valueOf();
    } else if (value._bsontype === 'Long') {
      return value.toNumber();
    }
    return value;
  }

  /**
   * Render the index definition
   *
   * @returns {React.Component} The index definition.
   */
  renderType() {
    const fields = map(this.props.index.fields.serialize(), (field) => {
      return (
        <span key={field.field} className={styles['name-column-definition-type-pair']}>
          <span className={classnames(styles['name-column-definition-type-pair-field'])}>
            {field.field}
            {this.renderDirection(field)}
          </span>
        </span>
      );
    });
    return (
      <div className={classnames(styles['name-column-definition'])}>
        <p className={classnames(styles['name-column-definition-type'])}>
          {fields}
        </p>
      </div>
    );
  }

  /**
   * Render the name column.
   *
   * @returns {React.Component} The name column.
   */
  render() {
    return (
      <td className={classnames(styles['name-column'])}>
        <div className="index-definition">
          <div className={classnames(styles['name-column-name'])} title={this.props.index.name}>
            {this.props.index.name}
          </div>
          {this.renderType()}
        </div>
      </td>
    );
  }
}

export default NameColumn;
