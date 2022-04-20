import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import map from 'lodash.map';

import classnames from 'classnames';
import styles from './index-definition-type.module.less';

/**
 * Component for an index definition type.
 */
class IndexDefinitionType extends PureComponent {
  static displayName = 'IndexDefinitionType';

  static propTypes = {
    index: PropTypes.object.isRequired,
    dataTestId: PropTypes.string,
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
        <span
          className={classnames(
            styles['index-definition-type-pair-field-sort']
          )}
        >
          <i className="fa fa-arrow-circle-up fa-lg" />
        </span>
      );
    } else if (field.value === -1) {
      return (
        <span
          className={classnames(
            styles['index-definition-type-pair-field-sort']
          )}
        >
          <i className="fa fa-arrow-circle-down fa-lg" />
        </span>
      );
    }
    return (
      <span
        className={classnames(styles['index-definition-type-pair-field-type'])}
      >
        {field.value._bsontype
          ? this.renderBsonValue(field.value)
          : field.value}
      </span>
    );
  }

  /**
   * Render the bson value.
   *
   * @param {Object} value - The value.
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
  render() {
    const fields = map(this.props.index.fields.serialize(), (field) => {
      return (
        <span
          key={field.field}
          className={classnames(styles['index-definition-type-pair'])}
        >
          <span
            className={classnames(styles['index-definition-type-pair-field'])}
          >
            {field.field}
            {this.renderDirection(field)}
          </span>
        </span>
      );
    });
    return (
      <div className={classnames(styles['index-definition'])}>
        <p
          className={classnames(styles['index-definition-type'])}
          data-test-id={this.props.dataTestId}
        >
          {fields}
        </p>
      </div>
    );
  }
}

export default IndexDefinitionType;
