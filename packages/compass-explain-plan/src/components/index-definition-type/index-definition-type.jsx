import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { map } from 'lodash';

import styles from './index-definition-type.module.less';

/**
 * The IndexDefinitionType component.
 */
class IndexDefinitionType extends Component {
  static displayName = 'IndexDefinitionType';

  static propTypes = {
    index: PropTypes.object.isRequired,
  };

  /**
   * Renders the direction of the index field.
   *
   * @param {Object} field - The field.
   *
   * @returns {React.Component} The field component.
   */
  renderDirection(field) {
    if (field.value === 1) {
      return (
        <span className={styles['index-definition-type-pair-field-sort']}>
          <i className="fa fa-arrow-circle-up fa-lg" />
        </span>
      );
    }

    if (field.value === -1) {
      return (
        <span className={styles['index-definition-type-pair-field-sort']}>
          <i className="fa fa-arrow-circle-down fa-lg" />
        </span>
      );
    }

    return (
      <span className={styles['index-definition-type-pair-field-type']}>
        {field.value._bsontype
          ? this.renderBsonValue(field.value)
          : field.value}
      </span>
    );
  }

  /**
   * Renders the bson value.
   *
   * @param {Object} value - The value.
   *
   * @returns {*} The field component.
   */
  renderBsonValue(value) {
    if (value._bsontype === 'Decimal128') {
      return value.toString();
    }

    if (value._bsontype === 'Int32') {
      return value.valueOf();
    }

    if (value._bsontype === 'Long') {
      return value.toNumber();
    }

    return value;
  }

  /**
   * Render the index definition
   *
   * @returns {React.Component} The index definition.
   */
  render() {
    const fields = map(this.props.index.fields.serialize(), (field) => (
      <span key={field.field} className={styles['index-definition-type-pair']}>
        <span className={styles['index-definition-type-pair-field']}>
          {field.field}
          {this.renderDirection(field)}
        </span>
      </span>
    ));

    return (
      <div className={styles['index-definition']}>
        <p className={styles['index-definition-type']}>{fields}</p>
      </div>
    );
  }
}

export default IndexDefinitionType;
