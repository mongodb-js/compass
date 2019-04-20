import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import map from 'lodash.map';

import styles from './index-definition-type.less';


/**
 * The IndexDefinitionType component.
 */
class IndexDefinitionType extends Component {
  static displayName = 'IndexDefinitionType';

  static propTypes = {
    index: PropTypes.object.isRequired
  }

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
        <span className={classnames(styles['index-definition-type-pair-field-sort'])}>
          <i className="fa fa-arrow-circle-up fa-lg" />
        </span>
      );
    }

    if (field.value === -1) {
      return (
        <span className={classnames(styles['index-definition-type-pair-field-sort'])}>
          <i className="fa fa-arrow-circle-down fa-lg" />
        </span>
      );
    }

    return (
      <span className={classnames(styles['index-definition-type-pair-field-type'])}>
        {field.value._bsontype ? this.renderBsonValue(field.value) : field.value}
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
      <span key={field.field} className={classnames(styles['index-definition-type-pair'])}>
        <span className={classnames(styles['index-definition-type-pair-field'])}>
          {field.field}
          {this.renderDirection(field)}
        </span>
      </span>
    ));

    return (
      <div className={classnames(styles['index-definition'])}>
        <p className={classnames(styles['index-definition-type'])}>
          {fields}
        </p>
      </div>
    );
  }
}

export default IndexDefinitionType;
